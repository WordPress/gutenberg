/**
 * Internal dependencies
 */
import conservativeMapItem from '../conservative-map-item';

describe( 'conservativeMapItem', () => {
	it( 'Returns the next item if there is no current item to compare with.', () => {
		const item = undefined;
		const nextItem = {};
		const result = conservativeMapItem( item, nextItem );

		expect( result ).toBe( nextItem );
	} );

	it( 'Returns the original item if all property values are the same, deeply.', () => {
		const item = { a: [ {} ] };
		const nextItem = { a: [ {} ] };
		const result = conservativeMapItem( item, nextItem );

		expect( result ).toBe( item );
	} );

	it( 'Preserves original references of property values when unchanged, deeply.', () => {
		const item = { a: [ {} ], b: [ 1 ] };
		const nextItem = { a: [ {} ], b: [ 2 ] };
		const result = conservativeMapItem( item, nextItem );

		expect( result ).not.toBe( item );
		expect( result.a ).toBe( item.a );
		expect( result.b ).toBe( nextItem.b );
		expect( result ).toEqual( { a: [ {} ], b: [ 2 ] } );
	} );

	it( 'merges to the original item', () => {
		const item = { a: [ 1 ], b: [ 2 ] };
		const nextItem = { c: [ 3 ], d: [ 4 ] };
		const result = conservativeMapItem( item, nextItem );

		expect( result ).not.toBe( item );
		expect( result.a ).toBe( item.a );
		expect( result.b ).toBe( item.b );
		expect( result.c ).toBe( nextItem.c );
		expect( result.d ).toBe( nextItem.d );
		expect( result ).toEqual( { a: [ 1 ], b: [ 2 ], c: [ 3 ], d: [ 4 ] } );
	} );
} );
