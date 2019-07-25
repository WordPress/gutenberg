/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reducer, {
	getMergedItemIds,
	mapItem,
} from '../reducer';

describe( 'getMergedItemIds', () => {
	it( 'should receive a page', () => {
		const result = getMergedItemIds( [], [ 4, 5, 6 ], 2, 3 );

		expect( result ).toEqual( [
			undefined,
			undefined,
			undefined,
			4,
			5,
			6,
		] );
	} );

	it( 'should merge into existing items', () => {
		const original = deepFreeze( [
			undefined,
			undefined,
			undefined,
			4,
			5,
			6,
		] );
		const result = getMergedItemIds( original, [ 1, 2, 3 ], 1, 3 );

		expect( result ).toEqual( [
			1,
			2,
			3,
			4,
			5,
			6,
		] );
	} );

	it( 'should replace with new page', () => {
		const original = deepFreeze( [
			1,
			2,
			3,
			4,
			5,
			6,
		] );
		const result = getMergedItemIds( original, [ 'replaced', 5, 6 ], 2, 3 );

		expect( result ).toEqual( [
			1,
			2,
			3,
			'replaced',
			5,
			6,
		] );
	} );

	it( 'should append a new partial page', () => {
		const original = deepFreeze( [
			1,
			2,
			3,
			4,
			5,
			6,
		] );
		const result = getMergedItemIds( original, [ 7 ], 3, 3 );

		expect( result ).toEqual( [
			1,
			2,
			3,
			4,
			5,
			6,
			7,
		] );
	} );
} );

describe( 'mapItem', () => {
	it( 'returns the next item if no current item against which to compare', () => {
		const item = undefined;
		const nextItem = {};
		const result = mapItem( item, nextItem );

		expect( result ).toBe( nextItem );
	} );

	it( 'returns the original item if all property values are the same, deeply', () => {
		const item = { a: [ {} ] };
		const nextItem = { a: [ {} ] };
		const result = mapItem( item, nextItem );

		expect( result ).toBe( item );
	} );

	it( 'preserves original references of property values when unchanged', () => {
		const item = { a: [ {} ], b: [ 1 ] };
		const nextItem = { a: [ {} ], b: [ 2 ] };
		const result = mapItem( item, nextItem );

		expect( result ).not.toBe( item );
		expect( result.a ).toBe( item.a );
		expect( result.b ).not.toBe( item.b );
		expect( result ).toEqual( { a: [ {} ], b: [ 2 ] } );
	} );
} );

describe( 'reducer', () => {
	it( 'returns a default value of its combined keys defaults', () => {
		const state = reducer( undefined, {} );

		expect( state ).toEqual( {
			items: {},
			queries: {},
		} );
	} );

	it( 'receives a page of queried data', () => {
		const original = deepFreeze( {
			items: {},
			queries: {},
		} );
		const state = reducer( original, {
			type: 'RECEIVE_ITEMS',
			query: { s: 'a', page: 1, per_page: 3 },
			items: [
				{ id: 1, name: 'abc' },
			],
		} );

		expect( state ).toEqual( {
			items: {
				1: { id: 1, name: 'abc' },
			},
			queries: {
				's=a': [ 1 ],
			},
		} );
	} );

	it( 'receives an unqueried page of items', () => {
		const original = deepFreeze( {
			items: {},
			queries: {},
		} );
		const state = reducer( original, {
			type: 'RECEIVE_ITEMS',
			items: [
				{ id: 1, name: 'abc' },
			],
		} );

		expect( state ).toEqual( {
			items: {
				1: { id: 1, name: 'abc' },
			},
			queries: {},
		} );
	} );

	it( 'avoids updating unchanged item value references', () => {
		const original = deepFreeze( {
			items: {
				1: { id: 1, name: 'abc', keys: [] },
			},
			queries: {},
		} );
		const state = reducer( original, {
			type: 'RECEIVE_ITEMS',
			items: [
				{ id: 1, name: 'def', keys: [] },
			],
		} );

		expect( state.items[ '1' ].keys ).toBe( original.items[ '1' ].keys );
	} );

	it( 'avoids updating unchanged item references', () => {
		const original = deepFreeze( {
			items: {
				1: { id: 1, name: 'abc', keys: [] },
			},
			queries: {},
		} );
		const state = reducer( original, {
			type: 'RECEIVE_ITEMS',
			items: [
				{ id: 1, name: 'abc', keys: [] },
			],
		} );

		expect( state.items[ '1' ] ).toBe( original.items[ '1' ] );
	} );
} );
