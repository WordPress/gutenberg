import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { render, act } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import SuggestionAutoSave, {
	operationsForBlock,
	POST_TITLE_CLIENT_ID,
} from '../auto-save';
import {
	SuggestionSessionProvider,
	useSuggestionSession,
} from '../suggestion-session';
import { postOperationsFromTitle } from '../operations';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

// The mock factory is hoisted above the imports, so the functions it hands
// out have to be created there too.
const { createSuggestion, updateSuggestion, deleteSuggestion } = vi.hoisted(
	() => ( {
		createSuggestion: vi.fn(),
		updateSuggestion: vi.fn(),
		deleteSuggestion: vi.fn(),
	} )
);

vi.mock( import( '../provider' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		...actual,
		useSuggestionsProvider: () =>
			( {
				createSuggestion,
				updateSuggestion,
				deleteSuggestion,
			} ) as unknown as ReturnType<
				typeof actual.useSuggestionsProvider
			>,
	};
} );

const TEST_BLOCK = 'core/test-autosave-heading';
const POST_ID = 7;

beforeAll( () => {
	// The real core-data store resolves selectors over REST, and jsdom has no
	// server: a failed request can reject after its test ends and fail the run.
	// Leave requests pending so the records each test seeds are the only data.
	apiFetch.setFetchHandler( () => new Promise( () => {} ) );
	registerBlockType( TEST_BLOCK, {
		apiVersion: 3,
		title: 'Test',
		category: 'text',
		attributes: {
			content: { type: 'string', default: '' },
			level: { type: 'number', default: 2 },
			metadata: { type: 'object' },
		},
		save() {
			return null;
		},
	} );
} );

beforeEach( () => {
	createSuggestion.mockReset();
	updateSuggestion.mockReset();
	deleteSuggestion.mockReset();
	vi.useFakeTimers();
} );

afterEach( () => {
	vi.useRealTimers();
} );

function createTestRegistry( intent: string, blocks: any[] ) {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( coreStore );
	// `setEditorIntent` compares the editor mode across the change so it can
	// announce a canvas swap, and `getEditorMode` reads the preferences store.
	registry.register( preferencesStore );
	registry.register( blockEditorStore );
	registry.register( editorStore );
	registry.dispatch( blockEditorStore ).resetBlocks( blocks );
	registry.dispatch( editorStore ).setEditedPost( 'post', POST_ID as any );
	unlock( registry.dispatch( editorStore ) ).setEditorIntent( intent );
	return registry;
}

function renderWith( intent: string, blocks: any[] ) {
	const registry = createTestRegistry( intent, blocks );
	const wrapper = ( { children }: { children?: React.ReactNode } ) => (
		<RegistryProvider value={ registry }>
			<SuggestionSessionProvider>{ children }</SuggestionSessionProvider>
		</RegistryProvider>
	);
	return {
		registry,
		...render(
			<>
				<CaptureSession />
				<SuggestionAutoSave />
			</>,
			{ wrapper }
		),
	};
}

const heading = ( content = 'Hi', extra: Record< string, any > = {} ) =>
	createBlock( TEST_BLOCK, { content, level: 2, ...extra } );

// Seed a comment record so `getEntityRecord( 'root', 'comment', id )` resolves
// without an HTTP fetch, mirroring what `useNoteThreads`'s entity query would
// have populated by the time a suggestion is in flight.
function seedComment( registry: any, comment: any ) {
	registry
		.dispatch( coreStore )
		.receiveEntityRecords( 'root', 'comment', [ comment ] );
}

const markerOf = ( registry: any, clientId: string ) =>
	registry.select( blockEditorStore ).getBlockAttributes( clientId )?.metadata
		?.suggestion;

// Write a proposal the way the HOC does: the whole marker, keeping what is
// already on it (commentId, authorId).
function propose(
	registry: any,
	clientId: string,
	after: Record< string, any >,
	marker: Record< string, any > = {}
) {
	act( () => {
		const attributes = registry
			.select( blockEditorStore )
			.getBlockAttributes( clientId );
		registry.dispatch( blockEditorStore ).updateBlockAttributes( clientId, {
			metadata: {
				...attributes.metadata,
				suggestion: {
					type: 'pending-attributes',
					authorId: null,
					...attributes.metadata?.suggestion,
					...marker,
					after,
				},
			},
		} );
	} );
}

// Stands in for the editor around the auto-saver, inside the session.
function CaptureSession() {
	useSuggestionSession();
	return null;
}

async function flushPromises() {
	await act( async () => {
		// Resolve any pending microtasks queued by setTimeout's await chain.
		await Promise.resolve();
	} );
}

async function pastDebounce() {
	await act( async () => {
		vi.advanceTimersByTime( 1500 );
	} );
	await flushPromises();
	await flushPromises();
}

describe( 'SuggestionAutoSave', () => {
	it( 'POSTs a new suggestion after the debounce window and writes the note id onto the marker', async () => {
		createSuggestion.mockResolvedValue( { id: 42 } );
		const block = heading();
		const { registry } = renderWith( 'suggest', [ block ] );

		propose( registry, block.clientId, { level: 3 } );

		// Before the debounce window: no POST.
		expect( createSuggestion ).not.toHaveBeenCalled();

		await pastDebounce();

		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( createSuggestion ).toHaveBeenCalledWith( {
			clientId: block.clientId,
			blockName: TEST_BLOCK,
			operations: [
				{
					type: 'attribute-set',
					attribute: 'level',
					before: 2,
					after: 3,
				},
			],
		} );
		expect( markerOf( registry, block.clientId ) ).toEqual( {
			type: 'pending-attributes',
			authorId: null,
			after: { level: 3 },
			commentId: 42,
		} );
		// The live block is untouched.
		expect(
			registry
				.select( blockEditorStore )
				.getBlockAttributes( block.clientId ).level
		).toBe( 2 );
	} );

	it( 'updates the same comment on subsequent edits', async () => {
		createSuggestion.mockResolvedValue( { id: 42 } );
		updateSuggestion.mockResolvedValue( { id: 42 } );
		const block = heading();
		const { registry } = renderWith( 'suggest', [ block ] );

		propose( registry, block.clientId, { level: 3 } );
		await pastDebounce();
		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );

		// User keeps editing.
		propose( registry, block.clientId, { level: 4 } );
		await pastDebounce();

		expect( updateSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( updateSuggestion ).toHaveBeenCalledWith(
			expect.objectContaining( {
				commentId: 42,
				operations: [
					expect.objectContaining( { attribute: 'level', after: 4 } ),
				],
			} )
		);
		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'trashes the note when the marker has nothing left to propose', async () => {
		createSuggestion.mockResolvedValue( { id: 42 } );
		deleteSuggestion.mockResolvedValue( undefined );
		const block = heading();
		const { registry } = renderWith( 'suggest', [ block ] );

		propose( registry, block.clientId, { level: 3 } );
		await pastDebounce();

		// The HOC never writes such a marker, but a peer or a stale sync
		// could: a proposal equal to the live value is no suggestion.
		propose( registry, block.clientId, { level: 2 } );
		await pastDebounce();

		expect( deleteSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( deleteSuggestion ).toHaveBeenCalledWith( {
			commentId: 42,
			clientId: block.clientId,
		} );
		expect(
			markerOf( registry, block.clientId ).commentId
		).toBeUndefined();
	} );

	it( 'does not duplicate work when the user keeps typing during an in-flight save', async () => {
		// `createSuggestion` resolves only when we explicitly let it.
		let resolveCreate!: ( value?: unknown ) => void;
		createSuggestion.mockImplementation(
			() =>
				new Promise( ( resolve ) => {
					resolveCreate = resolve;
				} )
		);
		updateSuggestion.mockResolvedValue( { id: 42 } );
		const block = heading();
		const { registry } = renderWith( 'suggest', [ block ] );

		propose( registry, block.clientId, { level: 3 } );
		await act( async () => {
			vi.advanceTimersByTime( 1500 );
		} );
		await flushPromises();

		// Save_A is in flight. User keeps editing.
		propose( registry, block.clientId, { level: 4 } );
		await act( async () => {
			vi.advanceTimersByTime( 1500 );
		} );
		await flushPromises();

		// No duplicate create: the second sync is queued behind the
		// in-flight create.
		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( updateSuggestion ).toHaveBeenCalledTimes( 0 );

		// Let save_A complete; the queued sync_B should now run as an update
		// on the just-issued comment id.
		await act( async () => {
			resolveCreate( { id: 42 } );
		} );
		await flushPromises();
		await flushPromises();
		await flushPromises();

		expect( updateSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( updateSuggestion ).toHaveBeenCalledWith(
			expect.objectContaining( {
				commentId: 42,
				operations: [ expect.objectContaining( { after: 4 } ) ],
			} )
		);
	} );

	it( 'creates a fresh suggestion when the linked note has been resolved', async () => {
		createSuggestion
			.mockResolvedValueOnce( { id: 42 } )
			.mockResolvedValueOnce( { id: 43 } );
		updateSuggestion.mockResolvedValue( { id: 42 } );
		const block = heading();
		const { registry } = renderWith( 'suggest', [ block ] );

		// User A's first edit. Auto-save creates note 42.
		propose( registry, block.clientId, { level: 3 } );
		await pastDebounce();
		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );

		// User B accepts note 42: the server flips status to 'approved'.
		seedComment( registry, { id: 42, status: 'approved' } );

		// User A keeps editing the same block.
		propose( registry, block.clientId, { level: 4 } );
		await pastDebounce();

		// The new edit must NOT update the resolved note 42; it spawns a
		// fresh note that coexists with the resolved one.
		expect( updateSuggestion ).not.toHaveBeenCalled();
		expect( createSuggestion ).toHaveBeenCalledTimes( 2 );
		expect( createSuggestion ).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				clientId: block.clientId,
				operations: [
					expect.objectContaining( { attribute: 'level', after: 4 } ),
				],
			} )
		);
		expect( markerOf( registry, block.clientId ).commentId ).toBe( 43 );
	} );

	it( 'continues to update the linked note while it is still pending', async () => {
		createSuggestion.mockResolvedValue( { id: 42 } );
		updateSuggestion.mockResolvedValue( { id: 42 } );
		const block = heading();
		const { registry } = renderWith( 'suggest', [ block ] );

		propose( registry, block.clientId, { level: 3 } );
		await pastDebounce();

		seedComment( registry, { id: 42, status: 'hold' } );

		propose( registry, block.clientId, { level: 4 } );
		await pastDebounce();

		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( updateSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( updateSuggestion ).toHaveBeenCalledWith(
			expect.objectContaining( { commentId: 42 } )
		);
	} );

	it( 'does not create a second note when the marker has no commentId but metadata.noteId links a pending attribute note', async () => {
		updateSuggestion.mockResolvedValue( { id: 42 } );
		// The editor was closed between the create and the commentId
		// write-back; the link survives in `metadata.noteId`.
		const block = heading( 'Hi', {
			metadata: {
				noteId: [ 42 ],
				suggestion: { type: 'pending-attributes', after: { level: 3 } },
			},
		} );
		const { registry } = renderWith( 'suggest', [ block ] );
		seedComment( registry, {
			id: 42,
			status: 'hold',
			type: 'note',
			post: POST_ID,
			meta: {
				_wp_suggestion_status: 'pending',
				_wp_suggestion: JSON.stringify( {
					schemaVersion: 2,
					blockName: TEST_BLOCK,
					baseRevision: null,
					operations: [
						{
							type: 'attribute-set',
							attribute: 'level',
							before: 2,
							after: 3,
						},
					],
				} ),
			},
		} );

		propose( registry, block.clientId, { level: 4 } );
		await pastDebounce();

		expect( createSuggestion ).not.toHaveBeenCalled();
		expect( updateSuggestion ).toHaveBeenCalledWith(
			expect.objectContaining( {
				commentId: 42,
				operations: [
					expect.objectContaining( { attribute: 'level', after: 4 } ),
				],
			} )
		);
	} );

	it( 'ignores a marker commentId that names a note on another post', async () => {
		createSuggestion.mockResolvedValue( { id: 43 } );
		// Content is editable by anyone who can edit the post, so an id read
		// from it is only a hint: this one points at someone else's note.
		const block = heading( 'Hi', {
			metadata: {
				suggestion: {
					type: 'pending-attributes',
					after: { level: 3 },
					commentId: 99,
				},
			},
		} );
		const { registry } = renderWith( 'suggest', [ block ] );
		seedComment( registry, {
			id: 99,
			status: 'hold',
			type: 'note',
			post: 123,
		} );

		propose( registry, block.clientId, { level: 4 } );
		await pastDebounce();

		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( updateSuggestion ).not.toHaveBeenCalled();
		expect( deleteSuggestion ).not.toHaveBeenCalled();
		expect( markerOf( registry, block.clientId ).commentId ).toBe( 43 );
	} );

	it( 'waits for a hinted note core-data has not resolved instead of opening a second one', async () => {
		createSuggestion.mockResolvedValue( { id: 43 } );
		const block = heading( 'Hi', {
			metadata: {
				suggestion: {
					type: 'pending-attributes',
					after: { level: 3 },
					commentId: 99,
				},
			},
		} );
		const { registry } = renderWith( 'suggest', [ block ] );

		propose( registry, block.clientId, { level: 4 } );
		await pastDebounce();

		expect( updateSuggestion ).not.toHaveBeenCalled();
		expect( deleteSuggestion ).not.toHaveBeenCalled();
		expect( createSuggestion ).not.toHaveBeenCalled();
	} );

	it( 'ignores a hinted note that belongs to another user', async () => {
		createSuggestion.mockResolvedValue( { id: 43 } );
		const block = heading( 'Hi', {
			metadata: {
				suggestion: {
					type: 'pending-attributes',
					after: { level: 3 },
					commentId: 99,
				},
			},
		} );
		const { registry } = renderWith( 'suggest', [ block ] );
		act( () => {
			registry.dispatch( coreStore ).receiveCurrentUser( { id: 3 } );
		} );
		seedComment( registry, {
			id: 99,
			status: 'hold',
			type: 'note',
			post: POST_ID,
			author: 8,
		} );

		propose( registry, block.clientId, { level: 4 } );
		await pastDebounce();

		expect( updateSuggestion ).not.toHaveBeenCalled();
		expect( deleteSuggestion ).not.toHaveBeenCalled();
		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not re-save a reloaded marker whose note already holds the same operations', async () => {
		const block = heading( 'Hi', {
			metadata: {
				noteId: [ 42 ],
				suggestion: {
					type: 'pending-attributes',
					after: { level: 3 },
					commentId: 42,
				},
			},
		} );
		const { registry } = renderWith( 'suggest', [ block ] );
		seedComment( registry, {
			id: 42,
			status: 'hold',
			type: 'note',
			post: POST_ID,
			meta: {
				_wp_suggestion_status: 'pending',
				_wp_suggestion: JSON.stringify( {
					schemaVersion: 2,
					blockName: TEST_BLOCK,
					baseRevision: null,
					operations: [
						{
							type: 'attribute-set',
							attribute: 'level',
							before: 2,
							after: 3,
						},
					],
				} ),
			},
		} );
		await pastDebounce();

		expect( updateSuggestion ).not.toHaveBeenCalled();
		expect( createSuggestion ).not.toHaveBeenCalled();
	} );

	it( 'opens a fresh note when the same proposal returns after its marker left', async () => {
		createSuggestion
			.mockResolvedValueOnce( { id: 42 } )
			.mockResolvedValueOnce( { id: 43 } );
		const block = heading();
		const { registry } = renderWith( 'suggest', [ block ] );

		propose( registry, block.clientId, { level: 3 } );
		await pastDebounce();
		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );

		// Undo pops the marker; the collector trashes note 42.
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( block.clientId, { metadata: {} } );
		} );
		seedComment( registry, { id: 42, status: 'trash' } );
		await pastDebounce();

		// The same proposal again is a new suggestion, not a no-op.
		propose( registry, block.clientId, { level: 3 } );
		await pastDebounce();
		expect( createSuggestion ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'leaves a proposal another author wrote to that author', async () => {
		const block = heading( 'Hi', {
			metadata: {
				suggestion: {
					type: 'pending-attributes',
					authorId: 7,
					after: { level: 3 },
				},
			},
		} );
		const { registry } = renderWith( 'suggest', [ block ] );
		act( () => {
			registry.dispatch( coreStore ).receiveCurrentUser( { id: 3 } );
		} );

		propose( registry, block.clientId, { level: 4 }, { authorId: 7 } );
		await pastDebounce();

		expect( createSuggestion ).not.toHaveBeenCalled();
	} );

	it( 'does nothing when the editor is not in Suggest intent', async () => {
		const block = heading();
		const { registry } = renderWith( 'edit', [ block ] );

		propose( registry, block.clientId, { level: 3 } );
		await act( async () => {
			vi.advanceTimersByTime( 5000 );
		} );
		await flushPromises();

		expect( createSuggestion ).not.toHaveBeenCalled();
	} );

	it( 'saves a pending suggestion right away when the user leaves Suggest intent', async () => {
		createSuggestion.mockResolvedValue( { id: 42 } );
		const block = heading();
		const { registry } = renderWith( 'suggest', [ block ] );

		propose( registry, block.clientId, { level: 3 } );

		// Leave Suggest mode mid-debounce. The suggestion was already made,
		// so it must not wait for a return to Suggest intent to persist.
		await act( async () => {
			vi.advanceTimersByTime( 500 );
		} );
		act( () => {
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'edit'
			);
		} );
		await flushPromises();
		await flushPromises();

		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );

		// Returning to Suggest does not save the same proposal twice.
		act( () => {
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'suggest'
			);
		} );
		await act( async () => {
			vi.advanceTimersByTime( 5000 );
		} );
		await flushPromises();

		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
	} );

	it( "does not postpone one block's save while another keeps changing", async () => {
		createSuggestion.mockImplementation( async ( { clientId } ) => ( {
			id: clientId === 'a' ? 1 : 2,
		} ) );
		const a = heading( 'A' );
		const b = heading( 'B' );
		const { registry } = renderWith( 'suggest', [ a, b ] );

		propose( registry, a.clientId, { level: 3 } );

		// Keep editing B every 500ms, past A's debounce window.
		for ( let i = 0; i < 4; i++ ) {
			propose( registry, b.clientId, { level: 3 + i } );
			await act( async () => {
				vi.advanceTimersByTime( 500 );
			} );
		}
		await flushPromises();
		await flushPromises();

		expect( createSuggestion ).toHaveBeenCalledWith(
			expect.objectContaining( { clientId: a.clientId } )
		);
		expect( createSuggestion ).not.toHaveBeenCalledWith(
			expect.objectContaining( { clientId: b.clientId } )
		);
	} );

	it( 'saves a pending suggestion when it unmounts', async () => {
		createSuggestion.mockResolvedValue( { id: 42 } );
		const block = heading();
		const { registry, rerender } = renderWith( 'suggest', [ block ] );

		propose( registry, block.clientId, { level: 3 } );

		rerender( <CaptureSession /> );
		await flushPromises();
		await flushPromises();

		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'saves the post title proposal with no block to link', async () => {
		createSuggestion.mockResolvedValue( { id: 9 } );
		const { registry } = renderWith( 'suggest', [] );

		act( () => {
			unlock( registry.dispatch( editorStore ) ).setPostFieldProposal(
				'title',
				{ attribute: 'title', baseline: 'Old', proposed: 'New' }
			);
		} );
		await pastDebounce();

		expect( createSuggestion ).toHaveBeenCalledWith( {
			clientId: undefined,
			blockName: '',
			operations: [
				{
					type: 'post-attribute-set',
					attribute: 'title',
					before: 'Old',
					after: 'New',
				},
			],
		} );
		expect( POST_TITLE_CLIENT_ID ).toBe( '__post_title__' );
	} );

	it( 'saves each post field proposal as its own note', async () => {
		createSuggestion.mockResolvedValue( { id: 10 } );
		const { registry } = renderWith( 'suggest', [] );

		act( () => {
			const { setPostFieldProposal } = unlock(
				registry.dispatch( editorStore )
			);
			setPostFieldProposal( 'excerpt', {
				attribute: 'excerpt',
				baseline: 'Old',
				proposed: 'New',
			} );
			setPostFieldProposal( 'meta.my_meta', {
				attribute: 'meta',
				key: 'my_meta',
				baseline: '',
				proposed: 'x',
			} );
		} );
		await pastDebounce();

		expect( createSuggestion ).toHaveBeenCalledTimes( 2 );
		expect( createSuggestion ).toHaveBeenCalledWith( {
			clientId: undefined,
			blockName: '',
			operations: [
				{
					type: 'post-attribute-set',
					attribute: 'meta',
					key: 'my_meta',
					before: '',
					after: 'x',
				},
			],
		} );
	} );
} );

describe( 'operationsForBlock', () => {
	const treeStub = {
		getBlock: ( clientId: string ) => ( {
			clientId,
			name: 'core/paragraph',
			attributes: {},
			innerBlocks: [],
		} ),
		getBlockName: () => 'core/paragraph',
		getBlockRootClientId: () => '',
		getBlockOrder: () => [ 'a' ],
		getBlockAttributes: () => ( {} ),
	} as any;

	it( 'derives attribute-set ops from live attributes and the marker after', () => {
		expect(
			operationsForBlock(
				'a',
				{
					level: 2,
					metadata: {
						suggestion: {
							type: 'pending-attributes',
							after: { level: 3 },
						},
					},
				},
				{ type: 'pending-attributes', after: { level: 3 } },
				undefined,
				treeStub
			)
		).toEqual( [
			{ type: 'attribute-set', attribute: 'level', before: 2, after: 3 },
		] );
	} );

	it( 'emits the recorded structural op first, then attribute ops', () => {
		const op = { type: 'block-move', clientId: 'a', fromIndex: 1 };
		expect(
			operationsForBlock(
				'a',
				{ level: 2 },
				{ type: 'pending-move', fromIndex: 1, after: { level: 3 } },
				{ op, seq: 1, blockName: 'core/paragraph' },
				treeStub
			)
		).toEqual( [
			op,
			{ type: 'attribute-set', attribute: 'level', before: 2, after: 3 },
		] );
	} );

	it( 'derives the structural op from the marker when no capture was recorded', () => {
		expect(
			operationsForBlock(
				'a',
				{ level: 2 },
				{ type: 'pending-remove' },
				undefined,
				treeStub
			)
		).toEqual( [
			expect.objectContaining( { type: 'block-remove', clientId: 'a' } ),
		] );
	} );

	it( 'derives post-attribute-set ops for the title proposal', () => {
		expect(
			postOperationsFromTitle( { baseline: 'Old', proposed: 'New' } )
		).toEqual( [
			{
				type: 'post-attribute-set',
				attribute: 'title',
				before: 'Old',
				after: 'New',
			},
		] );
		expect(
			postOperationsFromTitle( { baseline: 'Same', proposed: 'Same' } )
		).toEqual( [] );
	} );
} );
