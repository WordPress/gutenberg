import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import {
	createRegistry,
	createReduxStore,
	RegistryProvider,
} from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';
import {
	operationsFromMarker,
	applyOperations,
	hasAttributeConflict,
	parseSuggestionPayload,
	payloadByteLength,
	PAYLOAD_MAX_BYTES,
	findStructuralOp,
	findInlineOp,
	clearSuggestionMarkerAttributes,
	findPostAttributeOps,
	postOperationsFromTitle,
	applyPostOperations,
} from '../operations';
import { useSuggestionsProvider } from '../provider';
import { getSuggestionsResolvedThisSession } from '../decision-state';
import { SuggestionSessionProvider } from '../suggestion-session';

// Attribute values are `unknown` in the store types; the tests read them
// as the blocks define them.
const attributesOf = ( registry: any, clientId: string ): any =>
	registry.select( blockEditorStore ).getBlockAttributes( clientId );

// Block metadata is `unknown` in the store types; read its marker.
function blockMarkerOf( attributes: any ): Record< string, any > | undefined {
	return attributes?.metadata?.suggestion;
}

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

describe( 'operationsFromMarker', () => {
	it( 'emits one attribute-set op per changed key', () => {
		const ops = operationsFromMarker(
			{ content: 'Hello', level: 2 },
			{ content: 'Hi', level: 3 }
		);
		expect( ops ).toEqual( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'Hello',
				after: 'Hi',
			},
			{
				type: 'attribute-set',
				attribute: 'level',
				before: 2,
				after: 3,
			},
		] );
	} );

	it( 'skips attributes that equal their baseline', () => {
		const ops = operationsFromMarker(
			{ content: 'Same', level: 2 },
			{ content: 'Same', level: 3 }
		);
		expect( ops ).toEqual( [
			{
				type: 'attribute-set',
				attribute: 'level',
				before: 2,
				after: 3,
			},
		] );
	} );

	it( 'deep-compares object-valued attributes', () => {
		const ops = operationsFromMarker(
			{ style: { typography: { fontSize: '16px' } } },
			{ style: { typography: { fontSize: '16px' } } }
		);
		expect( ops ).toEqual( [] );
	} );

	it( 'is insensitive to key order in object-valued attributes', () => {
		// `style` re-emitted with reordered keys must not appear as a
		// changed attribute. A naive JSON.stringify compare would flag it.
		const ops = operationsFromMarker(
			{ style: { typography: { fontSize: '16px' }, color: 'red' } },
			{ style: { color: 'red', typography: { fontSize: '16px' } } }
		);
		expect( ops ).toEqual( [] );
	} );

	it( 'compares arrays element-wise', () => {
		expect(
			operationsFromMarker(
				{ classes: [ 'a', 'b' ] },
				{ classes: [ 'a', 'b' ] }
			)
		).toEqual( [] );
		const ops = operationsFromMarker(
			{ classes: [ 'a', 'b' ] },
			{ classes: [ 'b', 'a' ] }
		);
		expect( ops ).toHaveLength( 1 );
		expect( ops[ 0 ].attribute ).toBe( 'classes' );
	} );

	it( 'captures a null baseline when the attribute is new', () => {
		const ops = operationsFromMarker( {}, { url: 'https://x.test' } );
		expect( ops ).toEqual( [
			{
				type: 'attribute-set',
				attribute: 'url',
				before: null,
				after: 'https://x.test',
			},
		] );
	} );

	it( 'returns an empty array for an empty proposal', () => {
		expect( operationsFromMarker( { a: 1 }, {} ) ).toEqual( [] );
		expect( operationsFromMarker( { a: 1 }, null ) ).toEqual( [] );
	} );
} );

describe( 'post attribute operations', () => {
	const TITLE_OP = {
		type: 'post-attribute-set',
		attribute: 'title',
		before: 'Old',
		after: 'New',
	};

	it( 'builds post-attribute-set ops from a title proposal', () => {
		expect(
			postOperationsFromTitle( { baseline: 'Old', proposed: 'New' } )
		).toEqual( [ TITLE_OP ] );
		expect(
			postOperationsFromTitle( { baseline: 'Same', proposed: 'Same' } )
		).toEqual( [] );
		expect( postOperationsFromTitle( null ) ).toEqual( [] );
	} );

	it( 'finds only the post attribute ops in a payload', () => {
		expect(
			findPostAttributeOps( [
				{ type: 'attribute-set', attribute: 'level' },
				TITLE_OP,
			] )
		).toEqual( [ TITLE_OP ] );
		expect( findPostAttributeOps( undefined ) ).toEqual( [] );
	} );

	it( 'turns post attribute ops into post edits', () => {
		expect( applyPostOperations( [ TITLE_OP ] ) ).toEqual( {
			title: 'New',
		} );
	} );

	it( 'reports a conflict once the live title moved off the baseline', () => {
		expect( hasAttributeConflict( { title: 'Old' }, [ TITLE_OP ] ) ).toBe(
			false
		);
		expect(
			hasAttributeConflict( { title: 'Edited since' }, [ TITLE_OP ] )
		).toBe( true );
	} );
} );

describe( 'applyOperations', () => {
	it( 'applies attribute-set operations to produce new attributes', () => {
		const result = applyOperations(
			{ content: 'Hello', level: 2, align: 'left' },
			[
				{
					type: 'attribute-set',
					attribute: 'content',
					before: 'Hello',
					after: 'Hi',
				},
				{
					type: 'attribute-set',
					attribute: 'level',
					before: 2,
					after: 3,
				},
			]
		);
		expect( result ).toEqual( {
			content: 'Hi',
			level: 3,
			align: 'left',
		} );
	} );

	it( 'returns a copy even when operations are empty', () => {
		const attrs = { content: 'Same' };
		const result = applyOperations( attrs, [] );
		expect( result ).toEqual( attrs );
		expect( result ).not.toBe( attrs );
	} );

	it( 'composes with clearSuggestionMarkerAttributes to produce the inserted-block apply payload', () => {
		// When applying a block-insert-after suggestion the live block on
		// the accepter's side is in its captured-at-insertion shape — the
		// suggester's interceptor diverted any subsequent typing into the
		// overlay rather than committing it. Apply must (1) materialize
		// those overlay edits as attribute-set ops, AND (2) clear the
		// pending-insert marker. Combining `applyOperations` with
		// `clearSuggestionMarkerAttributes` yields the merged payload the
		// provider hands to `updateBlockAttributes`.
		const liveAttributes = {
			content: '',
			metadata: {
				noteId: [ 42 ],
				suggestion: { type: 'pending-insert' },
			},
		};
		const operations = [
			{
				type: 'block-insert-after',
				clientId: 'abc',
				blockName: 'core/paragraph',
				anchorClientId: null,
				parentClientId: null,
				block: { name: 'core/paragraph', attributes: { content: '' } },
			},
			{
				type: 'attribute-set',
				attribute: 'content',
				before: '',
				after: 'Hello world',
			},
		];

		const withOpsApplied = applyOperations( liveAttributes, operations );
		const markerCleared = clearSuggestionMarkerAttributes( withOpsApplied );
		const finalAttributes = markerCleared
			? { ...withOpsApplied, ...markerCleared }
			: withOpsApplied;

		// The typed content is committed to the live block...
		expect( finalAttributes.content ).toBe( 'Hello world' );
		// ...and the pending-insert marker is gone, while noteId
		// (system metadata) is preserved.
		expect( finalAttributes.metadata ).toEqual( { noteId: [ 42 ] } );
		expect( finalAttributes.metadata.suggestion ).toBeUndefined();
	} );
} );

describe( 'payloadByteLength', () => {
	it( 'measures ASCII payload byte length', () => {
		// {"a":"hello"} is 13 bytes.
		expect( payloadByteLength( { a: 'hello' } as any ) ).toBe( 13 );
	} );

	it( 'counts multi-byte characters by UTF-8 byte length', () => {
		// {"a":"€"} = 8 ASCII bytes + 3 bytes for the euro sign = 11.
		expect( payloadByteLength( { a: '€' } as any ) ).toBe( 11 );
	} );

	it( 'exposes a numeric size cap', () => {
		expect( PAYLOAD_MAX_BYTES ).toBeGreaterThan( 0 );
		expect( typeof PAYLOAD_MAX_BYTES ).toBe( 'number' );
	} );
} );

describe( 'hasAttributeConflict', () => {
	const CONTENT_OP = {
		type: 'attribute-set',
		attribute: 'content',
		before: 'Hello',
		after: 'Hi',
	};

	it( 'returns false when the targeted attribute still matches the baseline', () => {
		expect(
			hasAttributeConflict( { content: 'Hello', level: 2 }, [
				CONTENT_OP,
			] )
		).toBe( false );
	} );

	it( 'returns true when the targeted attribute has diverged', () => {
		expect(
			hasAttributeConflict( { content: 'Hola' }, [ CONTENT_OP ] )
		).toBe( true );
	} );

	it( 'compares a metadata proposal by the keys it changes', () => {
		const rename = {
			type: 'attribute-set',
			attribute: 'metadata',
			before: null,
			after: { name: 'Hero' },
		};
		// The marker and the note link are not part of the proposal.
		expect(
			hasAttributeConflict(
				{ metadata: { noteId: [ 1 ], suggestion: {} } },
				[ rename ]
			)
		).toBe( false );
		expect(
			hasAttributeConflict( { metadata: { name: 'Renamed since' } }, [
				rename,
			] )
		).toBe( true );
	} );

	it( 'ignores unrelated attribute changes on the block', () => {
		// Post modified bumps often because an unrelated attribute (or another
		// block entirely) changed — those should never count as a conflict
		// for this suggestion.
		expect(
			hasAttributeConflict(
				{ content: 'Hello', level: 3, align: 'center' },
				[ CONTENT_OP ]
			)
		).toBe( false );
	} );

	it( 'deep-compares object-valued attributes', () => {
		const op = {
			type: 'attribute-set',
			attribute: 'style',
			before: { typography: { fontSize: '16px' } },
			after: { typography: { fontSize: '20px' } },
		};
		expect(
			hasAttributeConflict(
				{ style: { typography: { fontSize: '16px' } } },
				[ op ]
			)
		).toBe( false );
		expect(
			hasAttributeConflict(
				{ style: { typography: { fontSize: '18px' } } },
				[ op ]
			)
		).toBe( true );
	} );

	it( 'treats a null baseline as equal to a missing current attribute', () => {
		const op = {
			type: 'attribute-set',
			attribute: 'url',
			before: null,
			after: 'https://x.test',
		};
		expect( hasAttributeConflict( {}, [ op ] ) ).toBe( false );
		expect(
			hasAttributeConflict( { url: 'https://other.test' }, [ op ] )
		).toBe( true );
	} );

	it( 'returns false for malformed input', () => {
		expect( hasAttributeConflict( {}, undefined ) ).toBe( false );
		expect( hasAttributeConflict( {}, [] ) ).toBe( false );
	} );

	it( 'compares string baselines against wrapper-object live values via toString', () => {
		// Regression: rich-text attributes are stored on a block as
		// `RichTextData` instances but serialize into the suggestion payload
		// as plain strings. Without a string-vs-wrapper fallback,
		// `hasAttributeConflict` flagged every content suggestion as stale
		// because `typeof string` !== `typeof object`, which short-circuited
		// the apply flow into a never-visible "Accept anyway" dialog.
		const wrapper = {
			toString() {
				return 'Hello';
			},
		};
		const wrapperOther = {
			toString() {
				return 'Hola';
			},
		};
		expect(
			hasAttributeConflict( { content: wrapper }, [ CONTENT_OP ] )
		).toBe( false );
		expect(
			hasAttributeConflict( { content: wrapperOther }, [ CONTENT_OP ] )
		).toBe( true );
	} );

	it( 'returns false for a block-insert-after payload even when attribute-set ops appear divergent', () => {
		// The overlay baseline for an inserted block is `{}` — every
		// attribute-set op the auto-save loop persists carries
		// `before: null` regardless of what the user typed. Comparing
		// that against the live (already-typed-into) block on the
		// accepting client must not fire the staleness prompt.
		const operations = [
			{
				type: 'block-insert-after',
				clientId: 'inserted',
				blockName: 'core/paragraph',
				anchorClientId: 'anchor',
				parentClientId: null,
				block: {
					name: 'core/paragraph',
					attributes: { content: 'Hi' },
					innerBlocks: [],
				},
			},
			{
				type: 'attribute-set',
				attribute: 'content',
				before: null,
				after: 'Hi',
			},
		];
		expect( hasAttributeConflict( { content: 'Hi' }, operations ) ).toBe(
			false
		);
	} );
} );

describe( 'parseSuggestionPayload', () => {
	it( 'parses a valid current-version JSON payload', () => {
		const raw = JSON.stringify( {
			schemaVersion: 2,
			blockName: 'core/paragraph',
			baseRevision: '2026-04-15T00:00:00',
			operations: [
				{
					type: 'attribute-set',
					attribute: 'content',
					before: 'a',
					after: 'b',
				},
			],
		} );
		const result = parseSuggestionPayload( raw )!;
		expect( result ).not.toBeNull();
		expect( result.schemaVersion ).toBe( 2 );
		expect( result.operations ).toHaveLength( 1 );
		expect( result.blockName ).toBe( 'core/paragraph' );
	} );

	it( 'migrates a v1 payload forward to the current version', () => {
		const raw = JSON.stringify( {
			schemaVersion: 1,
			blockName: 'core/paragraph',
			baseRevision: null,
			operations: [
				{
					type: 'attribute-set',
					attribute: 'content',
					before: 'a',
					after: 'b',
				},
			],
		} );
		const result = parseSuggestionPayload( raw )!;
		expect( result ).not.toBeNull();
		expect( result.schemaVersion ).toBe( 2 );
		expect( result.operations ).toHaveLength( 1 );
	} );

	it( 'treats a missing schemaVersion as v1 and migrates it', () => {
		const raw = JSON.stringify( {
			blockName: 'core/paragraph',
			baseRevision: null,
			operations: [
				{
					type: 'attribute-set',
					attribute: 'content',
					before: 'a',
					after: 'b',
				},
			],
		} );
		const result = parseSuggestionPayload( raw )!;
		expect( result ).not.toBeNull();
		expect( result.schemaVersion ).toBe( 2 );
	} );

	it( 'refuses a payload from a newer editor', () => {
		const raw = JSON.stringify( {
			schemaVersion: 99,
			blockName: 'core/paragraph',
			baseRevision: null,
			operations: [
				{
					type: 'block-rotate',
					clientId: 'x',
				},
			],
		} );
		expect( parseSuggestionPayload( raw ) ).toBeNull();
	} );

	it( 'returns null for missing, empty, or invalid input', () => {
		expect( parseSuggestionPayload( undefined ) ).toBeNull();
		expect( parseSuggestionPayload( '' ) ).toBeNull();
		expect( parseSuggestionPayload( 'not json' ) ).toBeNull();
		expect( parseSuggestionPayload( '42' ) ).toBeNull();
		expect(
			parseSuggestionPayload( JSON.stringify( { noOps: true } ) )
		).toBeNull();
	} );
} );

describe( 'findStructuralOp', () => {
	it( 'returns null for a payload of attribute-set ops only', () => {
		expect(
			findStructuralOp( [
				{ type: 'attribute-set', attribute: 'content', after: 'x' },
			] )
		).toBeNull();
	} );

	it( 'returns the block-remove op when present', () => {
		const op = {
			type: 'block-remove',
			clientId: 'abc',
			blockName: 'core/paragraph',
		};
		expect(
			findStructuralOp( [
				{ type: 'attribute-set', attribute: 'x', after: 1 },
				op,
			] )
		).toBe( op );
	} );

	it( 'recognizes block-insert-after and block-move op types', () => {
		expect(
			findStructuralOp( [ { type: 'block-insert-after' } ] )?.type
		).toBe( 'block-insert-after' );
		expect( findStructuralOp( [ { type: 'block-move' } ] )?.type ).toBe(
			'block-move'
		);
	} );

	it( 'returns null for non-array input', () => {
		expect( findStructuralOp( null ) ).toBeNull();
		expect( findStructuralOp( undefined ) ).toBeNull();
	} );
} );

describe( 'findInlineOp', () => {
	it( 'returns the inline-suggestion op when present', () => {
		const op = findInlineOp( [
			{ type: 'attribute-set', attribute: 'level', before: 2, after: 3 },
			{
				type: 'inline-suggestion',
				attribute: 'content',
				suggestionType: 'del',
			},
		] );
		expect( op?.type ).toBe( 'inline-suggestion' );
		expect( op?.attribute ).toBe( 'content' );
	} );

	it( 'returns null when there is no inline op', () => {
		expect(
			findInlineOp( [ { type: 'attribute-set', attribute: 'content' } ] )
		).toBeNull();
		expect( findInlineOp( [ { type: 'block-remove' } ] ) ).toBeNull();
	} );

	it( 'returns null for non-array input', () => {
		expect( findInlineOp( null ) ).toBeNull();
		expect( findInlineOp( undefined ) ).toBeNull();
	} );
} );

describe( 'clearSuggestionMarkerAttributes', () => {
	it( 'returns null when there is no marker to clear', () => {
		expect( clearSuggestionMarkerAttributes( {} ) ).toBeNull();
		expect(
			clearSuggestionMarkerAttributes( { metadata: { noteId: 1 } } )
		).toBeNull();
	} );

	it( 'strips the suggestion field while preserving other metadata', () => {
		expect(
			clearSuggestionMarkerAttributes( {
				content: 'hi',
				metadata: { noteId: 7, suggestion: { type: 'pending-remove' } },
			} )
		).toEqual( { metadata: { noteId: 7 } } );
	} );

	it( 'drops a proposal riding on a structural marker: the one note carried both ops', () => {
		expect(
			clearSuggestionMarkerAttributes( {
				metadata: {
					noteId: [ 7 ],
					suggestion: {
						type: 'pending-move',
						fromIndex: 1,
						authorId: 4,
						commentId: 7,
						after: { level: 3 },
					},
				},
			} )
		).toEqual( { metadata: { noteId: [ 7 ] } } );
	} );
} );

/*
 * Minimal `core/interface` stub tracking only the active complementary
 * area — the piece of state `createSuggestion` reads and writes when
 * surfacing a new note. Registered under the production store name so
 * the provider's descriptor-based lookups resolve to it.
 */
function createStubInterfaceStore() {
	return createReduxStore( 'core/interface', {
		reducer: ( state: any = { activeArea: null }, action: any ) =>
			action.type === 'ENABLE_AREA' ? { activeArea: action.area } : state,
		actions: {
			enableComplementaryArea: ( scope: string, area: string ) => ( {
				type: 'ENABLE_AREA',
				area,
			} ),
		},
		selectors: {
			getActiveComplementaryArea: ( state: any ) => state.activeArea,
		},
	} );
}

// The post being edited, as far as the provider needs to know it.
function createStubPostStore( postId: number ) {
	return createReduxStore( 'core/editor', {
		reducer: ( state = {} ) => state,
		selectors: {
			getCurrentPostId: () => postId,
			getCurrentPostType: () => 'post',
		},
	} );
}

describe( 'rejectSuggestion (block-move)', () => {
	const PARAGRAPH = 'core/test-move-paragraph';
	const GROUP = 'core/test-move-group';

	beforeAll( () => {
		registerBlockType( PARAGRAPH, {
			apiVersion: 3,
			attributes: {
				content: { type: 'string', default: '' },
				metadata: { type: 'object' },
			},
			save: () => null,
			category: 'text',
			title: 'Test Move Paragraph',
		} );
		registerBlockType( GROUP, {
			apiVersion: 3,
			attributes: {
				metadata: { type: 'object' },
			},
			save: () => null,
			category: 'design',
			title: 'Test Move Group',
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	/*
	 * The provider persists lifecycle updates through core-data's
	 * `saveEntityRecord`. A stub registered under the same store name keeps
	 * the reject flow synchronous and network-free — the assertions here are
	 * about the block tree, not the REST round-trip.
	 */
	function createStubCoreStore() {
		return createReduxStore( 'core', {
			reducer: ( state = {} ) => state,
			actions: {
				saveEntityRecord: () => ( { type: 'SAVE_ENTITY_RECORD' } ),
			},
			selectors: {
				getEditedEntityRecord: () => null,
				getEntityRecord: () => null,
				getCurrentUser: () => null,
			},
		} );
	}

	function setup( initialBlocks: any[] ) {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( blockEditorStore );
		registry.register( createStubCoreStore() );
		registry.register( createStubInterfaceStore() );
		registry.dispatch( blockEditorStore ).resetBlocks( initialBlocks );

		let providerHandle: ReturnType< typeof useSuggestionsProvider >;
		function CaptureProvider() {
			providerHandle = useSuggestionsProvider();
			return null;
		}

		render(
			<RegistryProvider value={ registry }>
				<CaptureProvider />
			</RegistryProvider>
		);

		return { registry, getProvider: () => providerHandle };
	}

	function movePayload( structuralOp: any ) {
		return {
			schemaVersion: 2,
			blockName: PARAGRAPH,
			baseRevision: null,
			operations: [ structuralOp ],
		};
	}

	it( 'restores a cross-parent move back to the original parent', async () => {
		// Current state: the block was suggested-moved from the root (index
		// 0) INTO the group. Reject must restore it to the root.
		const moved = createBlock( PARAGRAPH, {
			content: 'Moved',
			metadata: { suggestion: { type: 'pending-move' } },
		} );
		const sibling = createBlock( PARAGRAPH, { content: 'Sibling' } );
		const group = createBlock( GROUP, {}, [
			createBlock( PARAGRAPH, { content: 'Child' } ),
			moved,
		] );

		const { registry, getProvider } = setup( [ sibling, group ] );

		await act( async () => {
			await getProvider().rejectSuggestion( {
				commentId: 1,
				clientId: moved.clientId,
				payload: movePayload( {
					type: 'block-move',
					clientId: moved.clientId,
					blockName: PARAGRAPH,
					fromParentClientId: null,
					fromIndex: 0,
					toParentClientId: group.clientId,
				} ),
			} );
		} );

		const blockEditor = registry.select( blockEditorStore );
		// The block is back at the ROOT (its original parent), not stuck
		// inside the group. Before the fix, `moveBlockToPosition` received
		// the original parent as both from- and to-root, missed the block in
		// the destination parent, and silently left the tree unchanged.
		expect( blockEditor.getBlockRootClientId( moved.clientId ) || '' ).toBe(
			''
		);
		expect( blockEditor.getBlockIndex( moved.clientId ) ).toBe( 0 );
		// The pending-move marker is cleared.
		expect(
			blockEditor.getBlockAttributes( moved.clientId )?.metadata
				?.suggestion
		).toBeUndefined();
	} );

	it( 'restores a same-parent move back to its original index', async () => {
		const a = createBlock( PARAGRAPH, { content: 'A' } );
		const moved = createBlock( PARAGRAPH, {
			content: 'Moved',
			metadata: { suggestion: { type: 'pending-move' } },
		} );
		const b = createBlock( PARAGRAPH, { content: 'B' } );

		// Current order: [A, B, Moved] — the block was suggested-moved from
		// index 0 to the end of the root.
		const { registry, getProvider } = setup( [ a, b, moved ] );

		await act( async () => {
			await getProvider().rejectSuggestion( {
				commentId: 2,
				clientId: moved.clientId,
				payload: movePayload( {
					type: 'block-move',
					clientId: moved.clientId,
					blockName: PARAGRAPH,
					fromParentClientId: null,
					fromIndex: 0,
					toParentClientId: null,
				} ),
			} );
		} );

		const blockEditor = registry.select( blockEditorStore );
		expect( blockEditor.getBlockIndex( moved.clientId ) ).toBe( 0 );
		expect( blockEditor.getBlockRootClientId( moved.clientId ) || '' ).toBe(
			''
		);
	} );

	it( 'restores a nested same-parent move after a reload regenerated the ids', async () => {
		const first = createBlock( PARAGRAPH, { content: 'First' } );
		const moved = createBlock( PARAGRAPH, {
			content: 'Moved',
			metadata: { suggestion: { type: 'pending-move' } },
		} );
		// Current order inside the group: [First, Moved]; the block was
		// suggested-moved from index 0 in an earlier session.
		const group = createBlock( GROUP, {}, [ first, moved ] );

		const { registry, getProvider } = setup( [ group ] );

		await act( async () => {
			await getProvider().rejectSuggestion( {
				commentId: 3,
				clientId: moved.clientId,
				payload: movePayload( {
					type: 'block-move',
					clientId: moved.clientId,
					blockName: PARAGRAPH,
					// The group's id from the session that recorded the move.
					fromParentClientId: 'previous-session-group',
					fromIndex: 0,
					toParentClientId: 'previous-session-group',
				} ),
			} );
		} );

		const blockEditor = registry.select( blockEditorStore );
		expect( blockEditor.getBlockRootClientId( moved.clientId ) ).toBe(
			group.clientId
		);
		expect( blockEditor.getBlockIndex( moved.clientId ) ).toBe( 0 );
	} );
} );

describe( 'attribute proposals on the block marker', () => {
	const PARAGRAPH = 'core/test-proposal-paragraph';

	beforeAll( () => {
		registerBlockType( PARAGRAPH, {
			apiVersion: 3,
			attributes: {
				content: { type: 'string', default: '' },
				level: { type: 'number', default: 2 },
				metadata: { type: 'object' },
			},
			save: () => null,
			category: 'text',
			title: 'Test Proposal Paragraph',
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	function setup( initialBlocks: any[] ) {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( blockEditorStore );
		registry.register(
			createReduxStore( 'core', {
				reducer: ( state = {} ) => state,
				actions: {
					saveEntityRecord: () => ( { type: 'SAVE_ENTITY_RECORD' } ),
				},
				selectors: {
					getEditedEntityRecord: () => null,
					getEntityRecord: () => null,
					getCurrentUser: () => null,
				},
			} )
		);
		registry.register( createStubInterfaceStore() );
		registry.dispatch( blockEditorStore ).resetBlocks( initialBlocks );

		let providerHandle: ReturnType< typeof useSuggestionsProvider >;
		function Capture() {
			providerHandle = useSuggestionsProvider();
			return null;
		}

		render(
			<RegistryProvider value={ registry }>
				<SuggestionSessionProvider>
					<Capture />
				</SuggestionSessionProvider>
			</RegistryProvider>
		);

		return { registry, getProvider: () => providerHandle };
	}

	const attrs = ( registry: any, clientId: string ) =>
		attributesOf( registry, clientId );

	function levelPayload() {
		return {
			schemaVersion: 2,
			blockName: PARAGRAPH,
			baseRevision: null,
			operations: [
				{
					type: 'attribute-set',
					attribute: 'level',
					before: 2,
					after: 3,
				},
			],
		};
	}

	const proposedLevel = ( extra: Record< string, any > = {} ) =>
		createBlock( PARAGRAPH, {
			content: 'Hello',
			level: 2,
			metadata: {
				noteId: [ 42 ],
				suggestion: {
					type: 'pending-attributes',
					commentId: 42,
					after: { level: 3 },
				},
				...extra,
			},
		} );

	it( 'apply lands the proposal on the block and clears the marker in one update', async () => {
		const block = proposedLevel();
		const { registry, getProvider } = setup( [ block ] );

		await act( async () => {
			await getProvider().applySuggestion( {
				commentId: 42,
				clientId: block.clientId,
				payload: levelPayload(),
			} );
		} );

		const after = attrs( registry, block.clientId );
		expect( after.level ).toBe( 3 );
		expect( after.metadata.suggestion ).toBeUndefined();
		expect( after.metadata.noteId ).toEqual( [ 42 ] );
		expect(
			getSuggestionsResolvedThisSession( registry ).has( '42' )
		).toBe( true );
	} );

	it( 'reject drops the proposal and leaves the live block alone', async () => {
		const block = proposedLevel();
		const { registry, getProvider } = setup( [ block ] );

		await act( async () => {
			await getProvider().rejectSuggestion( {
				commentId: 42,
				clientId: block.clientId,
				payload: levelPayload(),
			} );
		} );

		const after = attrs( registry, block.clientId );
		expect( after.level ).toBe( 2 );
		expect( after.metadata.suggestion ).toBeUndefined();
		expect(
			getSuggestionsResolvedThisSession( registry ).has( '42' )
		).toBe( true );
	} );

	it( 'reject drops the proposal as a persistent change, so it is an undo level', async () => {
		const block = proposedLevel();
		const { registry, getProvider } = setup( [ block ] );

		await act( async () => {
			await getProvider().rejectSuggestion( {
				commentId: 42,
				clientId: block.clientId,
				payload: levelPayload(),
			} );
		} );

		expect(
			attrs( registry, block.clientId ).metadata.suggestion
		).toBeUndefined();
		expect(
			registry
				.select( blockEditorStore )
				.__unstableGetLastBlockChangeHistoryMode()
		).toBe( 'persistent' );
	} );

	it( 'reject drops a nested proposal as a persistent change too', async () => {
		const block = createBlock( PARAGRAPH, {
			content: 'Hello',
			level: 2,
			metadata: {
				noteId: [ 42, 43 ],
				suggestion: {
					type: 'pending-attributes',
					commentId: 42,
					authorId: 2,
					after: { level: 3 },
					nested: [
						{
							type: 'pending-attributes',
							commentId: 43,
							authorId: 3,
							after: { level: 4 },
						},
					],
				},
			},
		} );
		const { registry, getProvider } = setup( [ block ] );

		await act( async () => {
			await getProvider().rejectSuggestion( {
				commentId: 43,
				clientId: block.clientId,
				payload: levelPayload(),
			} );
		} );

		const marker = attrs( registry, block.clientId ).metadata.suggestion;
		expect( marker.commentId ).toBe( 42 );
		expect( marker.nested ).toBeUndefined();
		expect(
			registry
				.select( blockEditorStore )
				.__unstableGetLastBlockChangeHistoryMode()
		).toBe( 'persistent' );
	} );

	it( 'rejecting a move also drops the proposal that rode on it, since the note carried both', async () => {
		const a = createBlock( PARAGRAPH, { content: 'A' } );
		const moved = createBlock( PARAGRAPH, {
			content: 'Moved',
			level: 2,
			metadata: {
				noteId: [ 5 ],
				suggestion: {
					type: 'pending-move',
					authorId: 4,
					commentId: 5,
					fromIndex: 0,
					after: { level: 3 },
				},
			},
		} );
		// Current order: [A, Moved]; the block was moved from index 0.
		const { registry, getProvider } = setup( [ a, moved ] );

		await act( async () => {
			await getProvider().rejectSuggestion( {
				commentId: 5,
				clientId: moved.clientId,
				payload: {
					schemaVersion: 2,
					blockName: PARAGRAPH,
					baseRevision: null,
					operations: [
						{
							type: 'block-move',
							clientId: moved.clientId,
							blockName: PARAGRAPH,
							fromParentClientId: null,
							fromIndex: 0,
							toParentClientId: null,
						},
						{
							type: 'attribute-set',
							attribute: 'level',
							before: 2,
							after: 3,
						},
					],
				},
			} );
		} );

		const blockEditor = registry.select( blockEditorStore );
		expect( blockEditor.getBlockIndex( moved.clientId ) ).toBe( 0 );
		const after = attrs( registry, moved.clientId );
		expect( after.level ).toBe( 2 );
		expect( after.metadata.suggestion ).toBeUndefined();
	} );
} );

describe( 'decision failures leave the block tree untouched', () => {
	const PARAGRAPH = 'core/test-failure-paragraph';

	beforeAll( () => {
		registerBlockType( PARAGRAPH, {
			apiVersion: 3,
			attributes: {
				content: { type: 'string', default: '' },
				metadata: { type: 'object' },
			},
			save: () => null,
			category: 'text',
			title: 'Test Failure Paragraph',
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	// Same stub as the block-move suite, except the lifecycle write rejects
	// the way a dropped connection or a concurrently trashed note would.
	function createFailingCoreStore() {
		return createReduxStore( 'core', {
			reducer: ( state = {} ) => state,
			actions: {
				saveEntityRecord: () => () => {
					throw new Error( 'Network error' );
				},
			},
			selectors: {
				getEditedEntityRecord: () => null,
				getEntityRecord: () => null,
				getCurrentUser: () => null,
			},
		} );
	}

	function setup( initialBlocks: any[] ) {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( blockEditorStore );
		registry.register( createFailingCoreStore() );
		registry.register( createStubInterfaceStore() );
		registry.dispatch( blockEditorStore ).resetBlocks( initialBlocks );

		let providerHandle: ReturnType< typeof useSuggestionsProvider >;
		function CaptureProvider() {
			providerHandle = useSuggestionsProvider();
			return null;
		}

		render(
			<RegistryProvider value={ registry }>
				<CaptureProvider />
			</RegistryProvider>
		);

		return { registry, getProvider: () => providerHandle };
	}

	it( 'keeps the block when applying a block-remove suggestion fails', async () => {
		const target = createBlock( PARAGRAPH, {
			content: 'Doomed',
			metadata: {
				noteId: [ 7 ],
				suggestion: { type: 'pending-remove' },
			},
		} );
		const { registry, getProvider } = setup( [ target ] );

		await act( async () => {
			await getProvider().applySuggestion( {
				commentId: 7,
				clientId: target.clientId,
				payload: {
					schemaVersion: 2,
					blockName: PARAGRAPH,
					baseRevision: null,
					operations: [
						{
							type: 'block-remove',
							clientId: target.clientId,
							blockName: PARAGRAPH,
						},
					],
				},
			} );
		} );

		const blockEditor = registry.select( blockEditorStore );
		// The block survives, marker intact, so the still-pending note can
		// be applied or rejected again once the server is reachable.
		expect( blockEditor.getBlock( target.clientId ) ).not.toBeNull();
		expect(
			(
				blockEditor.getBlockAttributes( target.clientId )?.metadata
					?.suggestion as { type?: string } | undefined
			 )?.type
		).toBe( 'pending-remove' );
		expect(
			registry
				.select( noticesStore )
				.getNotices()
				.some( ( notice ) => notice.status === 'error' )
		).toBe( true );
	} );

	it( 'leaves a moved block in place when rejecting fails', async () => {
		const a = createBlock( PARAGRAPH, { content: 'A' } );
		const moved = createBlock( PARAGRAPH, {
			content: 'Moved',
			metadata: {
				noteId: [ 8 ],
				suggestion: { type: 'pending-move' },
			},
		} );
		// Current order is [ A, Moved ]; the suggestion moved it from index 0.
		const { registry, getProvider } = setup( [ a, moved ] );

		await act( async () => {
			await getProvider().rejectSuggestion( {
				commentId: 8,
				clientId: moved.clientId,
				payload: {
					schemaVersion: 2,
					blockName: PARAGRAPH,
					baseRevision: null,
					operations: [
						{
							type: 'block-move',
							clientId: moved.clientId,
							blockName: PARAGRAPH,
							fromParentClientId: null,
							fromIndex: 0,
							toParentClientId: null,
						},
					],
				},
			} );
		} );

		const blockEditor = registry.select( blockEditorStore );
		// No half-rejected state: the block stays at its suggested position
		// with the marker still on it.
		expect( blockEditor.getBlockIndex( moved.clientId ) ).toBe( 1 );
		expect(
			(
				blockEditor.getBlockAttributes( moved.clientId )?.metadata
					?.suggestion as { type?: string } | undefined
			 )?.type
		).toBe( 'pending-move' );
	} );
} );

describe( 'createSuggestion (sidebar)', () => {
	const PARAGRAPH = 'core/test-sidebar-paragraph';
	const ALL_NOTES_SIDEBAR = 'edit-post/collab-history-sidebar';

	beforeAll( () => {
		registerBlockType( PARAGRAPH, {
			apiVersion: 3,
			attributes: {
				content: { type: 'string', default: '' },
				metadata: { type: 'object' },
			},
			save: () => null,
			category: 'text',
			title: 'Test Sidebar Paragraph',
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	/*
	 * Store stubs registered under the production store names so the
	 * provider's descriptor-based lookups resolve to them. `saveEntityRecord`
	 * returns a record with an id so the post-save branch (metadata linkage
	 * and the sidebar switch) runs.
	 */
	function createStubCoreStore() {
		return createReduxStore( 'core', {
			reducer: ( state = {} ) => state,
			actions: {
				saveEntityRecord: () => () => ( { id: 123 } ),
			},
			selectors: {
				getEditedEntityRecord: () => null,
				getEntityRecord: () => null,
				getCurrentUser: () => null,
			},
		} );
	}

	function createStubEditorStore() {
		return createReduxStore( 'core/editor', {
			reducer: ( state = {} ) => state,
			selectors: {
				getCurrentPostId: () => 42,
				getCurrentPostType: () => 'post',
			},
		} );
	}

	function setup( { activeArea }: { activeArea?: string | null } ) {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( blockEditorStore );
		registry.register( createStubCoreStore() );
		registry.register( createStubEditorStore() );
		const interfaceStub = createStubInterfaceStore();
		registry.register( interfaceStub );
		if ( activeArea ) {
			registry
				.dispatch( interfaceStub )
				.enableComplementaryArea( 'core', activeArea );
		}

		const block = createBlock( PARAGRAPH, { content: 'Hello' } );
		registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );

		let providerHandle: ReturnType< typeof useSuggestionsProvider >;
		function CaptureProvider() {
			providerHandle = useSuggestionsProvider();
			return null;
		}

		render(
			<RegistryProvider value={ registry }>
				<CaptureProvider />
			</RegistryProvider>
		);

		return { registry, block, getProvider: () => providerHandle };
	}

	async function createAttributeSuggestion( getProvider: any, block: any ) {
		await act( async () => {
			await getProvider().createSuggestion( {
				clientId: block.clientId,
				blockName: PARAGRAPH,
				operations: [
					{
						type: 'attribute-set',
						attribute: 'content',
						value: 'Hello world',
						baseline: 'Hello',
					},
				],
			} );
		} );
	}

	it( 'leaves an open non-notes sidebar in place', async () => {
		const { registry, block, getProvider } = setup( {
			activeArea: 'edit-post/document',
		} );

		await createAttributeSuggestion( getProvider, block );

		expect(
			registry
				.select( 'core/interface' )
				.getActiveComplementaryArea( 'core' )
		).toBe( 'edit-post/document' );
	} );

	it( 'leaves a closed sidebar closed', async () => {
		const { registry, block, getProvider } = setup( {
			activeArea: null,
		} );

		await createAttributeSuggestion( getProvider, block );

		expect(
			registry
				.select( 'core/interface' )
				.getActiveComplementaryArea( 'core' )
		).toBe( null );
	} );

	it( 'leaves an already-open notes sidebar in place', async () => {
		const { registry, block, getProvider } = setup( {
			activeArea: ALL_NOTES_SIDEBAR,
		} );

		await createAttributeSuggestion( getProvider, block );

		expect(
			registry
				.select( 'core/interface' )
				.getActiveComplementaryArea( 'core' )
		).toBe( ALL_NOTES_SIDEBAR );
	} );
} );

describe( 'grouped structural decisions (block replacement)', () => {
	const PARAGRAPH = 'core/test-group-paragraph';
	const QUOTE = 'core/test-group-quote';
	const GROUP_ID = 'sg-test-1';

	beforeAll( () => {
		for ( const [ name, title ] of [
			[ PARAGRAPH, 'Test Group Paragraph' ],
			[ QUOTE, 'Test Group Quote' ],
		] ) {
			registerBlockType( name, {
				apiVersion: 3,
				attributes: {
					content: { type: 'string', default: '' },
					metadata: { type: 'object' },
				},
				save: () => null,
				category: 'text',
				title,
			} );
		}
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	function payloadFor( op: any ) {
		return {
			schemaVersion: 2,
			blockName: op.blockName,
			baseRevision: null,
			operations: [ op ],
		};
	}

	/**
	 * Stub core store whose `getEntityRecord` serves the two suggestion
	 * comments the group is made of, and which records every
	 * `saveEntityRecord` so the test can assert that BOTH notes were
	 * resolved by one decision.
	 *
	 * @param comments Comment records keyed by id.
	 * @param saves    Collector for saved records.
	 * @return Store descriptor.
	 */
	function createStubCoreStore(
		comments: Record< string, any >,
		saves: any[],
		control: { failNextSave: boolean }
	) {
		return createReduxStore( 'core', {
			reducer: ( state = {} ) => state,
			actions: {
				saveEntityRecord:
					( kind: any, name: any, record: any ) =>
					( { dispatch }: { dispatch: any } ) => {
						if ( control.failNextSave ) {
							control.failNextSave = false;
							throw new Error( 'Server rejected the update.' );
						}
						saves.push( record );
						dispatch( { type: 'SAVE_ENTITY_RECORD' } );
						return record;
					},
			},
			selectors: {
				getEditedEntityRecord: () => null,
				getEntityRecord: (
					state: any,
					kind: any,
					name: any,
					id: any
				) => comments[ id ] ?? null,
				getCurrentUser: () => null,
			},
		} );
	}

	function setup() {
		const removed = createBlock( PARAGRAPH, {
			content: 'Original',
			metadata: {
				suggestion: { type: 'pending-remove', groupId: GROUP_ID },
				noteId: [ 11 ],
			},
		} );
		const inserted = createBlock( QUOTE, {
			content: 'Original',
			metadata: {
				suggestion: { type: 'pending-insert', groupId: GROUP_ID },
				noteId: [ 12 ],
			},
		} );

		const removeOp = {
			type: 'block-remove',
			clientId: removed.clientId,
			blockName: PARAGRAPH,
			groupId: GROUP_ID,
		};
		const insertOp = {
			type: 'block-insert-after',
			clientId: inserted.clientId,
			blockName: QUOTE,
			anchorClientId: removed.clientId,
			parentClientId: null,
			groupId: GROUP_ID,
		};

		const comments = {
			11: {
				id: 11,
				meta: {
					_wp_suggestion: JSON.stringify( payloadFor( removeOp ) ),
				},
			},
			12: {
				id: 12,
				meta: {
					_wp_suggestion: JSON.stringify( payloadFor( insertOp ) ),
				},
			},
		};
		const saves: any[] = [];
		const control = { failNextSave: false };

		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( blockEditorStore );
		registry.register( createStubCoreStore( comments, saves, control ) );
		registry.register( createStubInterfaceStore() );
		registry
			.dispatch( blockEditorStore )
			.resetBlocks( [ removed, inserted ] );

		let providerHandle: ReturnType< typeof useSuggestionsProvider >;
		function CaptureProvider() {
			providerHandle = useSuggestionsProvider();
			return null;
		}
		render(
			<RegistryProvider value={ registry }>
				<CaptureProvider />
			</RegistryProvider>
		);

		return {
			registry,
			saves,
			control,
			removed,
			inserted,
			removeOp,
			insertOp,
			payloadFor,
			getProvider: () => providerHandle,
		};
	}

	it( 'accepting the insertion half also accepts the removal half', async () => {
		const { registry, saves, removed, inserted, insertOp, getProvider } =
			setup();

		await act( async () => {
			await getProvider().applySuggestion( {
				commentId: 12,
				clientId: inserted.clientId,
				payload: payloadFor( insertOp ),
			} );
		} );

		const blockEditor = registry.select( blockEditorStore );
		// The replacement stays and loses its pending treatment...
		expect( blockEditor.getBlock( inserted.clientId ) ).toBeTruthy();
		expect(
			blockEditor.getBlockAttributes( inserted.clientId )?.metadata
				?.suggestion
		).toBeUndefined();
		// ...and the block it replaced is gone, rather than left behind as a
		// duplicate with a still-pending removal note.
		expect( blockEditor.getBlock( removed.clientId ) ).toBeFalsy();

		expect( saves.map( ( record ) => record.id ).sort() ).toEqual( [
			11, 12,
		] );
		// Provisional and still open: the post save makes it final.
		expect(
			saves.every(
				( record ) =>
					record.status === 'hold' &&
					record.meta?._wp_suggestion_status === 'applied-unsaved'
			)
		).toBe( true );
	} );

	it( 'rejecting the removal half also rejects the insertion half', async () => {
		const { registry, saves, removed, inserted, removeOp, getProvider } =
			setup();

		await act( async () => {
			await getProvider().rejectSuggestion( {
				commentId: 11,
				clientId: removed.clientId,
				payload: payloadFor( removeOp ),
			} );
		} );

		const blockEditor = registry.select( blockEditorStore );
		// The original block stays and loses its pending treatment...
		expect( blockEditor.getBlock( removed.clientId ) ).toBeTruthy();
		expect(
			blockEditor.getBlockAttributes( removed.clientId )?.metadata
				?.suggestion
		).toBeUndefined();
		// ...and the replacement is withdrawn, rather than left in place as a
		// duplicate.
		expect( blockEditor.getBlock( inserted.clientId ) ).toBeFalsy();

		expect( saves.map( ( record ) => record.id ).sort() ).toEqual( [
			11, 12,
		] );
		expect(
			saves.every(
				( record ) =>
					record.status === 'hold' &&
					record.meta?._wp_suggestion_status === 'rejected-unsaved'
			)
		).toBe( true );
	} );

	it( 'stops the group when the first half fails to save', async () => {
		const {
			registry,
			saves,
			control,
			removed,
			inserted,
			insertOp,
			getProvider,
		} = setup();
		control.failNextSave = true;

		await act( async () => {
			await getProvider().applySuggestion( {
				commentId: 12,
				clientId: inserted.clientId,
				payload: payloadFor( insertOp ),
			} );
		} );

		const blockEditor = registry.select( blockEditorStore );
		// Neither half moved: the insertion keeps its pending treatment...
		expect(
			blockMarkerOf( blockEditor.getBlockAttributes( inserted.clientId ) )
				?.type
		).toBe( 'pending-insert' );
		// ...and the removal was never attempted, so the block is still
		// there for the user to decide on again.
		expect( blockEditor.getBlock( removed.clientId ) ).toBeTruthy();
		expect( saves ).toEqual( [] );
	} );

	it( 'leaves an ungrouped structural suggestion alone', async () => {
		const { registry, saves, removed, inserted, getProvider } = setup();

		// Same tree, but the decision is made against a payload with no
		// group id — the partner must not be dragged in.
		await act( async () => {
			await getProvider().rejectSuggestion( {
				commentId: 11,
				clientId: removed.clientId,
				payload: payloadFor( {
					type: 'block-remove',
					clientId: removed.clientId,
					blockName: PARAGRAPH,
				} ),
			} );
		} );

		expect(
			registry.select( blockEditorStore ).getBlock( inserted.clientId )
		).toBeTruthy();
		expect( saves.map( ( record ) => record.id ) ).toEqual( [ 11 ] );
	} );
} );

describe( 'withdrawn suggestions and failed applies', () => {
	const PARAGRAPH = 'core/test-withdraw-paragraph';

	beforeAll( () => {
		registerBlockType( PARAGRAPH, {
			apiVersion: 3,
			attributes: {
				content: { type: 'string', default: '' },
				align: { type: 'string' },
				metadata: { type: 'object' },
			},
			save: () => null,
			category: 'text',
			title: 'Test Withdraw Paragraph',
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	function setup( initialBlocks: any[], { failSave = false } = {} ) {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( blockEditorStore );
		registry.register(
			createReduxStore( 'core', {
				reducer: ( state = {} ) => state,
				actions: {
					saveEntityRecord: () =>
						failSave
							? () => {
									throw new Error( 'Network error' );
								}
							: { type: 'SAVE_ENTITY_RECORD' },
				},
				selectors: {
					getEditedEntityRecord: () => null,
					// The withdrawn note is the current user's own.
					getEntityRecord: () => ( {
						id: 7,
						type: 'note',
						author: 1,
						post: 5,
					} ),
					getCurrentUser: () => ( { id: 1 } ),
				},
			} )
		);
		registry.register( createStubPostStore( 5 ) );
		registry.register( createStubInterfaceStore() );
		registry.dispatch( blockEditorStore ).resetBlocks( initialBlocks );

		let providerHandle: ReturnType< typeof useSuggestionsProvider >;
		function Capture() {
			providerHandle = useSuggestionsProvider();
			return null;
		}

		render(
			<RegistryProvider value={ registry }>
				<SuggestionSessionProvider>
					<Capture />
				</SuggestionSessionProvider>
			</RegistryProvider>
		);

		return { registry, getProvider: () => providerHandle };
	}

	it( 'unlinks a withdrawn suggestion from the block metadata', async () => {
		const block = createBlock( PARAGRAPH, {
			content: 'Hello',
			metadata: { name: 'Intro', noteId: [ 3, 7 ] },
		} );
		const { registry, getProvider } = setup( [ block ] );

		await act( async () => {
			await getProvider().deleteSuggestion( {
				commentId: 7,
				clientId: block.clientId,
			} );
		} );

		expect( attributesOf( registry, block.clientId )?.metadata ).toEqual( {
			name: 'Intro',
			noteId: [ 3 ],
		} );
	} );

	it( 'drops empty metadata when the withdrawn note was its only content', async () => {
		const block = createBlock( PARAGRAPH, {
			content: 'Hello',
			metadata: { noteId: [ 7 ] },
		} );
		const { registry, getProvider } = setup( [ block ] );

		await act( async () => {
			await getProvider().deleteSuggestion( {
				commentId: 7,
				clientId: block.clientId,
			} );
		} );

		expect(
			attributesOf( registry, block.clientId )?.metadata
		).toBeUndefined();
	} );

	it( 'keeps the marker proposal when applying an attribute suggestion fails', async () => {
		const block = createBlock( PARAGRAPH, {
			content: 'Hello',
			metadata: {
				noteId: [ 7 ],
				suggestion: {
					type: 'pending-attributes',
					commentId: 7,
					after: { align: 'center' },
				},
			},
		} );
		const { registry, getProvider } = setup( [ block ], {
			failSave: true,
		} );

		await act( async () => {
			await getProvider().applySuggestion( {
				commentId: 7,
				clientId: block.clientId,
				payload: {
					schemaVersion: 2,
					blockName: PARAGRAPH,
					baseRevision: null,
					operations: [
						{
							type: 'attribute-set',
							attribute: 'align',
							before: null,
							after: 'center',
						},
					],
				},
			} );
		} );

		// The block rolls back and the proposal is still pending, so the
		// marker must survive for a retry.
		const attributes = attributesOf( registry, block.clientId );
		expect( attributes?.align ).toBeUndefined();
		expect( blockMarkerOf( attributes )?.after ).toEqual( {
			align: 'center',
		} );
	} );
} );

describe( 'suggester writes to a note named by content', () => {
	const PARAGRAPH = 'core/test-owned-note-paragraph';
	const ME = 3;
	const SOMEONE_ELSE = 8;
	const POST = 5;

	beforeAll( () => {
		registerBlockType( PARAGRAPH, {
			apiVersion: 3,
			attributes: {
				content: { type: 'string', default: '' },
				metadata: { type: 'object' },
			},
			save: () => null,
			category: 'text',
			title: 'Test Owned Note Paragraph',
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	/*
	 * A marker's note id is whatever the content says. `note` is what
	 * core-data holds for it, or null when it holds nothing.
	 */
	function setup(
		note: Record< string, any > | null,
		currentUser: { id: number } | null = { id: ME }
	) {
		const saved: any[] = [];
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( blockEditorStore );
		registry.register(
			createReduxStore( 'core', {
				reducer: ( state = {} ) => state,
				actions: {
					saveEntityRecord:
						( _kind: string, _name: string, record: any ) =>
						async () => {
							saved.push( record );
							return record;
						},
				},
				selectors: {
					getEditedEntityRecord: () => null,
					getEntityRecord: () => note,
					getCurrentUser: () => currentUser,
				},
			} )
		);
		registry.register( createStubPostStore( POST ) );
		registry.register( createStubInterfaceStore() );
		const block = createBlock( PARAGRAPH, {
			content: 'Hello',
			metadata: { noteId: [ 7 ] },
		} );
		registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );

		let providerHandle: ReturnType< typeof useSuggestionsProvider >;
		function Capture() {
			providerHandle = useSuggestionsProvider();
			return null;
		}

		render(
			<RegistryProvider value={ registry }>
				<SuggestionSessionProvider>
					<Capture />
				</SuggestionSessionProvider>
			</RegistryProvider>
		);

		return { registry, block, saved, getProvider: () => providerHandle };
	}

	const update = ( provider: ReturnType< typeof useSuggestionsProvider > ) =>
		provider.updateSuggestion( {
			commentId: 7,
			blockName: PARAGRAPH,
			operations: [
				{
					type: 'inline-suggestion',
					attribute: 'content',
					suggestionType: 'replace',
				},
			],
		} );

	it( 'updates the current user’s own note', async () => {
		const { saved, getProvider } = setup( {
			id: 7,
			type: 'note',
			author: ME,
			post: POST,
		} );

		await act( async () => {
			await update( getProvider() );
		} );

		expect( saved ).toHaveLength( 1 );
		expect( saved[ 0 ].id ).toBe( 7 );
	} );

	it( 'refuses to rewrite another user’s note', async () => {
		const { saved, getProvider } = setup( {
			id: 7,
			type: 'note',
			author: SOMEONE_ELSE,
			post: POST,
		} );

		await act( async () => {
			await expect( update( getProvider() ) ).rejects.toThrow();
		} );

		expect( saved ).toEqual( [] );
	} );

	it( 'refuses to trash another user’s note, and leaves its link', async () => {
		const { registry, block, saved, getProvider } = setup( {
			id: 7,
			type: 'note',
			author: SOMEONE_ELSE,
			post: POST,
		} );

		await act( async () => {
			await expect(
				getProvider().deleteSuggestion( {
					commentId: 7,
					clientId: block.clientId,
				} )
			).rejects.toThrow();
		} );

		expect( saved ).toEqual( [] );
		expect( attributesOf( registry, block.clientId )?.metadata ).toEqual( {
			noteId: [ 7 ],
		} );
	} );

	it( 'refuses a note core-data does not hold', async () => {
		const { saved, getProvider } = setup( null );

		await act( async () => {
			await expect( update( getProvider() ) ).rejects.toThrow();
		} );

		expect( saved ).toEqual( [] );
	} );

	it.each( [
		[ 'on another post', { post: 123 } ],
		[ 'with no post recorded', {} ],
	] )( 'refuses a note %s', async ( _label, where ) => {
		const { saved, getProvider } = setup( {
			id: 7,
			type: 'note',
			author: ME,
			...where,
		} );

		await act( async () => {
			await expect( update( getProvider() ) ).rejects.toThrow();
		} );

		expect( saved ).toEqual( [] );
	} );

	it( 'refuses while the current user cannot be resolved', async () => {
		const { saved, getProvider } = setup(
			{ id: 7, type: 'note', author: ME, post: POST },
			null
		);

		await act( async () => {
			await expect( update( getProvider() ) ).rejects.toThrow();
		} );
		await act( async () => {
			await expect(
				getProvider().deleteSuggestion( { commentId: 7 } )
			).rejects.toThrow();
		} );

		expect( saved ).toEqual( [] );
	} );

	it( 'refuses a comment that is not a note', async () => {
		const { saved, getProvider } = setup( {
			id: 7,
			type: 'comment',
			author: ME,
			post: POST,
		} );

		await act( async () => {
			await expect(
				getProvider().deleteSuggestion( { commentId: 7 } )
			).rejects.toThrow();
		} );

		expect( saved ).toEqual( [] );
	} );
} );

describe( 'decisions record a provisional status first', () => {
	const BLOCK = 'core/test-order-paragraph';

	beforeAll( () => {
		registerBlockType( BLOCK, {
			apiVersion: 3,
			attributes: {
				content: { type: 'string', default: '' },
				level: { type: 'number', default: 2 },
				metadata: { type: 'object' },
			},
			save: () => null,
			category: 'text',
			title: 'Test Order Paragraph',
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	/**
	 * Mounts the provider over one block. Each comment save records the block
	 * as it was when the request went out, and can be made to fail.
	 *
	 * @param block    The block.
	 * @param failSave Whether the status write fails.
	 * @return Harness.
	 */
	function setup( block: any, failSave = false ) {
		const saves: Array< { record: any; attributes: any } > = [];
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( blockEditorStore );
		registry.register(
			createReduxStore( 'core', {
				reducer: ( state = {} ) => state,
				actions: {
					saveEntityRecord:
						( kind: any, name: any, record: any ) => async () => {
							saves.push( {
								record,
								attributes: attributesOf(
									registry,
									block.clientId
								),
							} );
							if ( failSave ) {
								throw new Error( 'save failed' );
							}
							return record;
						},
				},
				selectors: {
					getEditedEntityRecord: () => null,
					getEntityRecord: () => null,
					getCurrentUser: () => null,
				},
			} )
		);
		registry.register( createStubInterfaceStore() );
		registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );

		let providerHandle: ReturnType< typeof useSuggestionsProvider >;
		function Capture() {
			providerHandle = useSuggestionsProvider();
			return null;
		}
		render(
			<RegistryProvider value={ registry }>
				<SuggestionSessionProvider>
					<Capture />
				</SuggestionSessionProvider>
			</RegistryProvider>
		);
		return {
			registry,
			saves,
			getProvider: () => providerHandle,
			attributes: () => attributesOf( registry, block.clientId ),
		};
	}

	const proposedLevel = () =>
		createBlock( BLOCK, {
			content: 'Title',
			level: 2,
			metadata: {
				noteId: [ 9 ],
				suggestion: {
					type: 'pending-attributes',
					commentId: 9,
					after: { level: 3 },
				},
			},
		} );
	const levelPayload = {
		schemaVersion: 2,
		blockName: BLOCK,
		baseRevision: null,
		operations: [
			{ type: 'attribute-set', attribute: 'level', before: 2, after: 3 },
		],
	};
	const removal = () =>
		createBlock( BLOCK, {
			content: 'Gone',
			metadata: {
				noteId: [ 9 ],
				suggestion: { type: 'pending-remove', commentId: 9 },
			},
		} );
	const removalPayload = ( clientId: string ) => ( {
		schemaVersion: 2,
		blockName: BLOCK,
		baseRevision: null,
		operations: [ { type: 'block-remove', clientId, blockName: BLOCK } ],
	} );

	it( 'writes the status before landing an attribute proposal', async () => {
		const block = proposedLevel();
		const harness = setup( block );

		await act( async () => {
			await harness.getProvider().applySuggestion( {
				commentId: 9,
				clientId: block.clientId,
				payload: levelPayload,
			} );
		} );

		expect( harness.saves[ 0 ].record.meta._wp_suggestion_status ).toBe(
			'applied-unsaved'
		);
		expect( harness.saves[ 0 ].attributes.level ).toBe( 2 );
		expect( harness.attributes().level ).toBe( 3 );
	} );

	it( 'writes the status before removing a block', async () => {
		const block = removal();
		const harness = setup( block );

		await act( async () => {
			await harness.getProvider().applySuggestion( {
				commentId: 9,
				clientId: block.clientId,
				payload: removalPayload( block.clientId ),
			} );
		} );

		expect( harness.saves[ 0 ].attributes ).toBeTruthy();
		expect( harness.attributes() ).toBeFalsy();
	} );

	it.each( [
		[ 'an attribute proposal', proposedLevel, () => levelPayload ],
		[
			'a block removal',
			removal,
			( clientId: string ) => removalPayload( clientId ),
		],
	] as const )(
		'changes nothing when the status write for %s fails',
		async ( label, makeBlock, makePayload ) => {
			const block = makeBlock();
			const harness = setup( block, true );
			const before = harness.attributes();

			await act( async () => {
				await harness.getProvider().applySuggestion( {
					commentId: 9,
					clientId: block.clientId,
					payload: makePayload( block.clientId ) as any,
				} );
			} );

			expect( harness.attributes() ).toBe( before );
			expect(
				( harness.registry.select( noticesStore ) as any )
					.getNotices()
					.some( ( notice: any ) => notice.status === 'error' )
			).toBe( true );
		}
	);
} );
