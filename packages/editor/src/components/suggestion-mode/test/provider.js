/**
 * Internal dependencies
 */
import {
	operationsFromOverlay,
	applyOperations,
	hasAttributeConflict,
	parseSuggestionPayload,
	payloadByteLength,
	PAYLOAD_MAX_BYTES,
	findStructuralOp,
	findInlineOp,
	clearSuggestionMarkerAttributes,
} from '../provider';

describe( 'operationsFromOverlay', () => {
	it( 'emits one attribute-set op per changed key', () => {
		const ops = operationsFromOverlay(
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
		const ops = operationsFromOverlay(
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
		const ops = operationsFromOverlay(
			{ style: { typography: { fontSize: '16px' } } },
			{ style: { typography: { fontSize: '16px' } } }
		);
		expect( ops ).toEqual( [] );
	} );

	it( 'is insensitive to key order in object-valued attributes', () => {
		// `style` re-emitted with reordered keys must not appear as a
		// changed attribute. A naive JSON.stringify compare would flag it.
		const ops = operationsFromOverlay(
			{ style: { typography: { fontSize: '16px' }, color: 'red' } },
			{ style: { color: 'red', typography: { fontSize: '16px' } } }
		);
		expect( ops ).toEqual( [] );
	} );

	it( 'compares arrays element-wise', () => {
		expect(
			operationsFromOverlay(
				{ classes: [ 'a', 'b' ] },
				{ classes: [ 'a', 'b' ] }
			)
		).toEqual( [] );
		const ops = operationsFromOverlay(
			{ classes: [ 'a', 'b' ] },
			{ classes: [ 'b', 'a' ] }
		);
		expect( ops ).toHaveLength( 1 );
		expect( ops[ 0 ].attribute ).toBe( 'classes' );
	} );

	it( 'captures a null baseline when the attribute is new', () => {
		const ops = operationsFromOverlay( {}, { url: 'https://x.test' } );
		expect( ops ).toEqual( [
			{
				type: 'attribute-set',
				attribute: 'url',
				before: null,
				after: 'https://x.test',
			},
		] );
	} );

	it( 'returns an empty array for an empty overlay', () => {
		expect( operationsFromOverlay( { a: 1 }, {} ) ).toEqual( [] );
		expect( operationsFromOverlay( { a: 1 }, null ) ).toEqual( [] );
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
		expect( payloadByteLength( { a: 'hello' } ) ).toBe( 13 );
	} );

	it( 'counts multi-byte characters by UTF-8 byte length', () => {
		// {"a":"€"} = 8 ASCII bytes + 3 bytes for the euro sign = 11.
		expect( payloadByteLength( { a: '€' } ) ).toBe( 11 );
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
		// the apply flow into a never-visible "Apply anyway" dialog.
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
		const result = parseSuggestionPayload( raw );
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
		const result = parseSuggestionPayload( raw );
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
		const result = parseSuggestionPayload( raw );
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
} );
