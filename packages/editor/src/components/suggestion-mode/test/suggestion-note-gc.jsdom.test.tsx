import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { createRegistry, RegistryProvider, select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';
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

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const POST_ID = 77;
const NOTE_ID = 9;
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

	registry.dispatch( editorStore ).setEditedPost( 'post', POST_ID as any );

	const block = createBlock( TEST_BLOCK_NAME, {
		content: RichTextData.fromHTMLString( content ),
		metadata: { noteId: [ NOTE_ID ] },
	} );
	registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );
	registry
		.dispatch( coreStore )
		.receiveEntityRecords( 'root', 'comment', threads, THREADS_QUERY );

	const saveEntityRecord = vi
		.spyOn( registry.dispatch( coreStore ), 'saveEntityRecord' )
		.mockResolvedValue( {} );

	render(
		<RegistryProvider value={ registry }>
			<SuggestionOverlayProvider>
				<SuggestionNoteGC />
			</SuggestionOverlayProvider>
		</RegistryProvider>
	);

	return { registry, saveEntityRecord };
}

afterEach( () => {
	forgetResolvedSuggestion( NOTE_ID );
	vi.restoreAllMocks();
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

describe( 'SuggestionNoteGC collecting a withdrawn marker', () => {
	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'retries a trash request that failed while the marker stays gone', async () => {
		vi.useFakeTimers( { toFake: [ 'setTimeout', 'clearTimeout' ] } );

		let registry: any;
		let saveEntityRecord: any;
		// The marker is on screen first, so the collector observes the anchor
		// before it disappears; it never collects an anchor it has not seen.
		await act( async () => {
			( { registry, saveEntityRecord } = setup( {
				content: MARKED,
				threads: [ note( { status: 'hold', lifecycle: 'pending' } ) ],
			} ) );
		} );
		expect( saveEntityRecord ).not.toHaveBeenCalled();

		// The server refuses the first trash.
		saveEntityRecord.mockRejectedValueOnce( new Error( 'Offline' ) );

		// Undo withdraws the marker: the note's anchor is gone.
		const [ clientId ] = registry
			.select( blockEditorStore )
			.getClientIdsWithDescendants();
		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, {
					content: RichTextData.fromHTMLString( 'Hello world' ),
				} );
		} );

		// The grace period runs out and the first trash is attempted.
		await act( async () => {
			vi.advanceTimersByTime( 600 );
		} );
		expect( saveEntityRecord ).toHaveBeenCalledTimes( 1 );
		expect( saveEntityRecord ).toHaveBeenLastCalledWith(
			'root',
			'comment',
			{ id: NOTE_ID, status: 'trash' },
			expect.anything()
		);

		// Nothing else changed, so only the retry can collect the note.
		await act( async () => {
			vi.advanceTimersByTime( 5000 );
		} );
		expect( saveEntityRecord ).toHaveBeenCalledTimes( 2 );
		expect( saveEntityRecord ).toHaveBeenLastCalledWith(
			'root',
			'comment',
			{ id: NOTE_ID, status: 'trash' },
			expect.anything()
		);
	} );
} );
