/**
 * Internal dependencies
 */
import { getQueriedItems } from '../selectors';

describe( 'getQueriedItems', () => {
	it( 'should return null if requesting but no item IDs', () => {
		const state = {
			items: {},
			queries: {},
		};

		const result = getQueriedItems( state );

		expect( result ).toBe( null );
	} );

	it( 'should return an array of items', () => {
		const state = {
			items: {
				1: { id: 1 },
				2: { id: 2 },
			},
			queries: {
				'': [ 1, 2 ],
			},
		};

		const result = getQueriedItems( state );

		expect( result ).toEqual( [
			{ id: 1 },
			{ id: 2 },
		] );
	} );

	it( 'should cache on query by state', () => {
		const state = {
			items: {
				1: { id: 1 },
				2: { id: 2 },
			},
			queries: [ 1, 2 ],
		};

		const resultA = getQueriedItems( state, {} );
		const resultB = getQueriedItems( state, {} );

		expect( resultA ).toBe( resultB );
	} );
} );
