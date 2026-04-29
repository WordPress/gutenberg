/**
 * Internal dependencies
 */
import {
	operationsFromOverlay,
	payloadByteLength,
	PAYLOAD_MAX_BYTES,
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
