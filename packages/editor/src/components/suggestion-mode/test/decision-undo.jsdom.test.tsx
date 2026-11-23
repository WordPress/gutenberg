/**
 * Decisions on the undo stack, against the real entity history: the block
 * editor syncs to the post entity, undo and redo run through the editor
 * store, and the note collector follows the marker.
 */
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore, useEntityBlockEditor } from '@wordpress/core-data';
import {
	BlockEditorProvider,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as noticesStore } from '@wordpress/notices';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import {
	getBlockTypes,
	registerBlockType,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import SuggestionNoteGC from '../suggestion-note-gc';
import SuggestionUndoGuard from '../suggestion-undo-guard';
import { SuggestionSessionProvider } from '../suggestion-session';
import { useSuggestionDecisions } from '../use-suggestion-decisions';
import { readSuggestionMarker } from '../marker';
import { store as editorStore } from '../../../store';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

vi.mock( import( '@wordpress/api-fetch' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		default: vi.fn(),
	} as unknown as typeof original;
} );

const POST_ID = 77;
const NOTE_ID = 9;
const NESTED_NOTE_ID = 12;
const REVIEWER = 1;
const HEADING = 'test/decision-undo-heading';

const levelPayload = ( after: number ) => ( {
	schemaVersion: 2,
	blockName: HEADING,
	baseRevision: null,
	operations: [
		{ type: 'attribute-set', attribute: 'level', before: 2, after },
	],
} );

const pendingNote = ( id: number, author: number, after: number ) => ( {
	id,
	parent: 0,
	post: POST_ID,
	type: 'note',
	author,
	status: 'hold',
	meta: {
		_wp_suggestion_status: 'pending',
		_wp_suggestion: JSON.stringify( levelPayload( after ) ),
	},
} );

const postContent = ( suggestion: Record< string, unknown > ) =>
	`<!-- wp:${ HEADING } ${ JSON.stringify( {
		content: 'Hello',
		level: 2,
		metadata: {
			noteId: [ NOTE_ID, NESTED_NOTE_ID ],
			suggestion,
		},
	} ) } /-->`;

// The comments the server holds, by id; saves write here.
let serverNotes: Record< number, any > = {};

function setup( suggestion: Record< string, unknown > ) {
	const notes = [
		pendingNote( NOTE_ID, 2, 3 ),
		pendingNote( NESTED_NOTE_ID, 3, 4 ),
	];
	serverNotes = Object.fromEntries(
		notes.map( ( note ) => [ note.id, note ] )
	);
	( apiFetch as unknown as ReturnType< typeof vi.fn > ).mockReset();
	( apiFetch as unknown as ReturnType< typeof vi.fn > ).mockImplementation(
		async ( { path, method, data }: any ) => {
			// Notes are only read for a post type that supports them.
			if ( path?.startsWith( '/wp/v2/types/post' ) ) {
				return {
					slug: 'post',
					supports: { editor: [ { notes: true } ] },
				};
			}
			const single = /^\/wp\/v2\/comments\/(\d+)/.exec( path ?? '' );
			if ( single && method && method !== 'GET' ) {
				const id = Number( single[ 1 ] );
				serverNotes[ id ] = {
					...serverNotes[ id ],
					...data,
					meta: { ...serverNotes[ id ].meta, ...data.meta },
				};
				return serverNotes[ id ];
			}
			if ( single ) {
				return serverNotes[ Number( single[ 1 ] ) ];
			}
			if ( path?.startsWith( '/wp/v2/comments' ) ) {
				return path.includes( 'parent=' )
					? []
					: Object.values( serverNotes );
			}
			return {};
		}
	);

	const registry = createRegistry();
	registry.register( coreStore );
	registry.register( preferencesStore );
	registry.register( blockEditorStore );
	registry.register( editorStore );
	registry.register( noticesStore );
	registry.register( keyboardShortcutsStore );
	// Block types are registered globally, for the parser; the editor reads
	// them from its own registry.
	registry.register( blocksStore );
	registry.dispatch( blocksStore ).addBlockTypes( getBlockTypes() );

	const core = registry.dispatch( coreStore ) as any;
	core.addEntities( [
		{
			kind: 'postType',
			name: 'post',
			baseURL: '/wp/v2/posts',
			transientEdits: { blocks: true, selection: true },
			mergedEdits: { meta: true },
			rawAttributes: [ 'title', 'excerpt', 'content' ],
		},
	] );
	core.receiveEntityRecords( 'root', 'postType', [
		{ slug: 'post', supports: { editor: [ { notes: true } ] } },
	] );
	core.receiveEntityRecords( 'postType', 'post', [
		{
			id: POST_ID,
			type: 'post',
			content: { raw: postContent( suggestion ) },
			meta: {},
		},
	] );
	core.receiveCurrentUser( { id: REVIEWER } );
	core.receiveEntityRecords( 'root', 'comment', notes, {
		post: POST_ID,
		type: 'note',
		status: 'all',
		per_page: -1,
	} );
	registry.dispatch( editorStore ).setEditedPost( 'post', POST_ID as any );

	let decisions: ReturnType< typeof useSuggestionDecisions >;
	function Capture() {
		decisions = useSuggestionDecisions();
		return null;
	}
	function Editor() {
		const [ blocks, onInput, onChange ] = useEntityBlockEditor(
			'postType',
			'post',
			{ id: POST_ID }
		);
		return (
			<BlockEditorProvider
				value={ blocks }
				onInput={ onInput }
				onChange={ onChange }
				useSubRegistry={ false }
			>
				<SuggestionSessionProvider>
					<Capture />
					<SuggestionUndoGuard />
					<SuggestionNoteGC />
				</SuggestionSessionProvider>
			</BlockEditorProvider>
		);
	}
	render(
		<RegistryProvider value={ registry }>
			<Editor />
		</RegistryProvider>
	);

	const blockEditor = registry.select( blockEditorStore );
	const attributes = (): any =>
		blockEditor.getBlockAttributes( blockEditor.getBlockOrder()[ 0 ] );
	return {
		registry,
		attributes,
		clientId: () => blockEditor.getBlockOrder()[ 0 ],
		marker: () => readSuggestionMarker( attributes() ),
		status: ( id: number ) => serverNotes[ id ].meta._wp_suggestion_status,
		decisions: () => decisions,
		type: async ( content: string ) => {
			await act( async () => {
				registry
					.dispatch( blockEditorStore )
					.updateBlockAttributes( blockEditor.getBlockOrder()[ 0 ], {
						content,
					} );
			} );
		},
		undo: async () => {
			await act( async () => {
				registry.dispatch( editorStore ).undo();
			} );
		},
		redo: async () => {
			await act( async () => {
				registry.dispatch( editorStore ).redo();
			} );
		},
		isDirty: () =>
			registry
				.select( coreStore )
				.hasEditsForEntityRecord( 'postType', 'post', POST_ID ),
	};
}

describe( 'rejected proposals on the undo stack', () => {
	beforeAll( () => {
		registerBlockType( HEADING, {
			apiVersion: 3,
			title: 'Decision undo heading',
			category: 'text',
			attributes: {
				content: { type: 'string', default: '' },
				level: { type: 'number', default: 2 },
				metadata: { type: 'object' },
			},
			save: () => null,
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	afterEach( () => {
		vi.restoreAllMocks();
	} );

	const OUTER = {
		type: 'pending-attributes',
		commentId: NOTE_ID,
		authorId: 2,
		after: { level: 3 },
	};
	const NESTED = {
		type: 'pending-attributes',
		commentId: NESTED_NOTE_ID,
		authorId: 3,
		after: { level: 4 },
	};

	it( 'makes a rejected attribute proposal its own undo level', async () => {
		const editor = setup( OUTER );
		await waitFor( () => expect( editor.marker() ).toMatchObject( OUTER ) );

		await editor.type( 'Hello world' );
		await act( async () => {
			await editor.decisions().rejectSuggestion( {
				commentId: NOTE_ID,
				clientId: editor.clientId(),
				payload: levelPayload( 3 ),
			} );
		} );
		expect( editor.marker() ).toBeNull();
		expect( editor.status( NOTE_ID ) ).toBe( 'rejected-unsaved' );

		// Undo takes back the reject alone: the edit before it stays, and
		// the proposal returns with its note awaiting a decision again.
		await editor.undo();
		expect( editor.attributes().content ).toBe( 'Hello world' );
		expect( editor.marker() ).toMatchObject( OUTER );
		await waitFor( () =>
			expect( editor.status( NOTE_ID ) ).toBe( 'pending' )
		);

		// Redo rejects again.
		await editor.redo();
		expect( editor.attributes().content ).toBe( 'Hello world' );
		expect( editor.marker() ).toBeNull();
		await waitFor( () =>
			expect( editor.status( NOTE_ID ) ).toBe( 'rejected-unsaved' )
		);

		// Undoing past the reject reaches the edit, proposal still pending.
		await editor.undo();
		await waitFor( () =>
			expect( editor.status( NOTE_ID ) ).toBe( 'pending' )
		);
		await editor.undo();
		expect( editor.attributes().content ).toBe( 'Hello' );
		expect( editor.marker() ).toMatchObject( OUTER );
		expect( editor.status( NOTE_ID ) ).toBe( 'pending' );
	} );

	it( 'gives the post something to save after an attribute reject', async () => {
		const editor = setup( OUTER );
		await waitFor( () => expect( editor.marker() ).toMatchObject( OUTER ) );
		expect( editor.isDirty() ).toBe( false );

		await act( async () => {
			await editor.decisions().rejectSuggestion( {
				commentId: NOTE_ID,
				clientId: editor.clientId(),
				payload: levelPayload( 3 ),
			} );
		} );

		expect( editor.marker() ).toBeNull();
		expect( editor.isDirty() ).toBe( true );
	} );

	it( 'makes a rejected nested proposal its own undo level', async () => {
		const editor = setup( { ...OUTER, nested: [ NESTED ] } );
		await waitFor( () =>
			expect( editor.marker()?.nested ).toMatchObject( [ NESTED ] )
		);

		await editor.type( 'Hello world' );
		await act( async () => {
			await editor.decisions().rejectSuggestion( {
				commentId: NESTED_NOTE_ID,
				clientId: editor.clientId(),
				payload: levelPayload( 4 ),
			} );
		} );
		expect( editor.marker() ).toMatchObject( OUTER );
		expect( editor.marker()?.nested ).toBeUndefined();
		expect( editor.status( NESTED_NOTE_ID ) ).toBe( 'rejected-unsaved' );

		await editor.undo();
		expect( editor.attributes().content ).toBe( 'Hello world' );
		expect( editor.marker()?.nested ).toMatchObject( [ NESTED ] );
		await waitFor( () =>
			expect( editor.status( NESTED_NOTE_ID ) ).toBe( 'pending' )
		);

		await editor.redo();
		expect( editor.marker()?.nested ).toBeUndefined();
		await waitFor( () =>
			expect( editor.status( NESTED_NOTE_ID ) ).toBe( 'rejected-unsaved' )
		);
		// The outer proposal was never decided.
		expect( editor.status( NOTE_ID ) ).toBe( 'pending' );
	} );
} );
