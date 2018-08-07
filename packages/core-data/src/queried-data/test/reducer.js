/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reducer, {
	getMergedItemIds,
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
			query: { s: 'a', page: 1, perPage: 3 },
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
} );
