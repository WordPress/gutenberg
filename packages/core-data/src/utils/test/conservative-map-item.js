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
} );
