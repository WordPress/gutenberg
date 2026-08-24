import { render, act } from '@testing-library/react';
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
	 * @param threads Note threads the sidebar query resolves to.
	 * @return The registry and the `saveEntityRecord` spy.
	 */
	async function withdrawMarker( threads: any[] ) {
		let harness: any;
		await act( async () => {
			harness = setup( { content: MARKED, threads } );
		} );

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
} );
