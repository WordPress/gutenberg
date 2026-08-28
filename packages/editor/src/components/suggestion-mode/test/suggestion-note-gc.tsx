import { render, act } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider, select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as noticesStore } from '@wordpress/notices';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import { RichTextData, store as richTextStore } from '@wordpress/rich-text';
import SuggestionNoteGC from '../suggestion-note-gc';
import { SuggestionOverlayProvider } from '../overlay-context';
import {
	registerSuggestionFormat,
	SUGGESTION_FORMAT_NAME,
} from '../../inline-suggestions';
import {
	getSuggestionsResolvedThisSession,
	forgetResolvedSuggestion,
} from '../provider';
import { store as editorStore } from '../../../store';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

/*
 * What the comments endpoint answers with. The reply guard asks the server
 * directly rather than reading the store, so these - not the records seeded
 * into the cache - are what it sees. `serverReplies` answers the collector's
 * `parent=<note>` probe; an `Error` makes that request fail.
 */
let serverThreads: any[] = [];
let serverReplies: any[] | Error = [];

const POST_ID = 77;
const NOTE_ID = 9;
const REPLY_ID = 10;
const TEST_BLOCK_NAME = 'test/note-gc-block';

const THREADS_QUERY = {
	post: POST_ID,
	type: 'note',
	status: 'all',
	per_page: -1,
};

/*
 * An inline `add` suggestion note. `status` / `_wp_suggestion_status` describe
 * the note's lifecycle: `hold` with no lifecycle status is pending, `approved`
 * plus `applied` is a decision that has landed.
 */
function note( { status = 'approved', lifecycle = 'applied' } = {} ) {
	return {
		id: NOTE_ID,
		parent: 0,
		status,
		meta: {
			_wp_suggestion_status: lifecycle,
			_wp_suggestion: JSON.stringify( {
				schemaVersion: 2,
				operations: [
					{
						type: 'inline-suggestion',
						attribute: 'content',
						suggestionType: 'add',
					},
				],
			} ),
		},
	};
}

/*
 * A reply on the note above. Replies are children of the root comment, so
 * trashing the root takes them with it - which is why the collector checks.
 */
function reply() {
	return {
		id: REPLY_ID,
		parent: NOTE_ID,
		status: 'hold',
		meta: {},
	};
}

const MARKED = `Hello <mark class="wp-suggestion" data-suggestion-id="${ NOTE_ID }" data-suggestion-type="add" data-author="1">world</mark>`;

beforeAll( () => {
	registerBlockType( TEST_BLOCK_NAME, {
		apiVersion: 3,
		title: 'Note GC block',
		category: 'text',
		attributes: {
			content: { type: 'rich-text', source: 'rich-text' },
			metadata: { type: 'object' },
		},
		save: () => null,
	} );
	if (
		! ( select( richTextStore as any ) as any ).getFormatType(
			SUGGESTION_FORMAT_NAME
		)
	) {
		registerSuggestionFormat();
	}
} );

function setup( { content, threads }: { content: string; threads: any[] } ) {
	serverThreads = threads;
	serverReplies = threads.filter(
		( thread: any ) => thread.parent === NOTE_ID
	);
	( apiFetch as unknown as jest.Mock ).mockReset();
	( apiFetch as unknown as jest.Mock ).mockImplementation(
		async ( { path }: any ) => {
			if ( ! path.includes( `parent=${ NOTE_ID }` ) ) {
				return serverThreads;
			}
			if ( serverReplies instanceof Error ) {
				throw serverReplies;
			}
			return serverReplies;
		}
	);

	const registry = createRegistry();
	registry.register( coreStore );
	registry.register( preferencesStore );
	registry.register( blockEditorStore );
	registry.register( editorStore );
	registry.register( noticesStore );

	registry.dispatch( editorStore ).setEditedPost( 'post', POST_ID as any );

	const block = createBlock( TEST_BLOCK_NAME, {
		content: RichTextData.fromHTMLString( content ),
		metadata: { noteId: [ NOTE_ID ] },
	} );
	registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );
	registry
		.dispatch( coreStore )
		.receiveEntityRecords( 'root', 'comment', threads, THREADS_QUERY );

	const saveEntityRecord = jest
		.spyOn( registry.dispatch( coreStore ), 'saveEntityRecord' )
		.mockResolvedValue( {} );

	render(
		<RegistryProvider value={ registry }>
			<SuggestionOverlayProvider>
				<SuggestionNoteGC />
			</SuggestionOverlayProvider>
		</RegistryProvider>
	);

	return { registry, saveEntityRecord, clientId: block.clientId };
}

afterEach( () => {
	forgetResolvedSuggestion( NOTE_ID );
	jest.restoreAllMocks();
} );

describe( 'SuggestionNoteGC reopening an undone decision', () => {
	it( 'reopens a note this session resolved when its marker comes back', async () => {
		/*
		 * The state an undo leaves behind: the block change is walked back so
		 * the marker is on screen again, but the comment's status is on the
		 * server and no keystroke reached it. Without the reopen the run stays
		 * marked with no Accept/Reject on it (#73411, F-18).
		 */
		getSuggestionsResolvedThisSession().add( String( NOTE_ID ) );

		let saveEntityRecord;
		await act( async () => {
			( { saveEntityRecord } = setup( {
				content: MARKED,
				threads: [ note() ],
			} ) );
		} );

		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'root',
			'comment',
			{
				id: NOTE_ID,
				status: 'hold',
				meta: { _wp_suggestion_status: 'pending' },
			},
			expect.anything()
		);
	} );

	it( 'leaves a resolved note alone while its marker is gone', async () => {
		// The ordinary post-decision state: the decision stands.
		getSuggestionsResolvedThisSession().add( String( NOTE_ID ) );

		let saveEntityRecord;
		await act( async () => {
			( { saveEntityRecord } = setup( {
				content: 'Hello world',
				threads: [ note() ],
			} ) );
		} );

		expect( saveEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'does not reopen a decision this session did not make', async () => {
		/*
		 * A peer's decision arriving through sync before this session's content
		 * catches up looks exactly like an undo from the outside. Reopening it
		 * would undo their review, so only decisions made here are tracked.
		 */
		let saveEntityRecord;
		await act( async () => {
			( { saveEntityRecord } = setup( {
				content: MARKED,
				threads: [ note() ],
			} ) );
		} );

		expect( saveEntityRecord ).not.toHaveBeenCalled();
	} );
} );

describe( 'SuggestionNoteGC collecting a withdrawn suggestion', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	/**
	 * Mounts the collector on a marked block, then takes the marker away the
	 * way an undo would, and lets the grace period run out.
	 *
	 * @param threads    Note threads the sidebar query resolves to at mount.
	 * @param repliesNow What the server reports for the note's replies once the
	 *                   marker is gone, when that differs from what the editor
	 *                   loaded: the replies a peer added since, or `null` for a
	 *                   request that fails.
	 * @return The registry and the `saveEntityRecord` spy.
	 */
	async function withdrawMarker( threads: any[], repliesNow?: any[] | null ) {
		let harness: any;
		await act( async () => {
			harness = setup( { content: MARKED, threads } );
		} );

		if ( repliesNow === null ) {
			serverReplies = new Error( 'Network error' );
		} else if ( repliesNow !== undefined ) {
			serverReplies = repliesNow;
		}

		await act( async () => {
			harness.registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( harness.clientId, {
					content: RichTextData.fromHTMLString( 'Hello world' ),
				} );
		} );

		await act( async () => {
			jest.advanceTimersByTime( 1000 );
		} );

		/*
		 * The collection waits on a request before it decides. Each round runs
		 * the timers the last one queued and flushes the promises they settle.
		 */
		for ( let round = 0; round < 3; round++ ) {
			await act( async () => {
				jest.runOnlyPendingTimers();
			} );
		}

		return harness;
	}

	it( 'trashes a pending note nobody has replied to', async () => {
		const { saveEntityRecord } = await withdrawMarker( [
			note( { status: 'hold', lifecycle: 'pending' } ),
		] );

		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'root',
			'comment',
			{ id: NOTE_ID, status: 'trash' },
			expect.anything()
		);
	} );

	it( 'keeps a pending note that has replies, and says so', async () => {
		const { registry, saveEntityRecord } = await withdrawMarker( [
			note( { status: 'hold', lifecycle: 'pending' } ),
			reply(),
		] );

		expect( saveEntityRecord ).not.toHaveBeenCalled();
		expect(
			( registry.select( noticesStore ) as any ).getNotices()[ 0 ].content
		).toContain( 'kept because it has replies' );
	} );

	it( 'keeps a pending note whose reply arrived in another session', async () => {
		/*
		 * The reported case (#81958): the colleague answered after this editor
		 * loaded its thread list, so the copy in the store still says nobody
		 * replied. Reading that copy would take their comment with the
		 * withdrawal - the guard has to ask the server.
		 */
		const { registry, saveEntityRecord } = await withdrawMarker(
			[ note( { status: 'hold', lifecycle: 'pending' } ) ],
			[ reply() ]
		);

		expect( saveEntityRecord ).not.toHaveBeenCalled();
		expect(
			( registry.select( noticesStore ) as any ).getNotices()[ 0 ].content
		).toContain( 'kept because it has replies' );
	} );

	it( 'keeps a pending note without announcing when the reply check fails', async () => {
		/*
		 * A failed check answers "unknown", not "no replies". Keep the note,
		 * but claim nothing about why: the snackbar would assert replies that
		 * may not exist. Nothing is latched either, so the next presence change
		 * asks again.
		 */
		const { registry, saveEntityRecord } = await withdrawMarker(
			[ note( { status: 'hold', lifecycle: 'pending' } ) ],
			null
		);

		expect( saveEntityRecord ).not.toHaveBeenCalled();
		expect(
			( registry.select( noticesStore ) as any ).getNotices()
		).toHaveLength( 0 );
	} );
} );
