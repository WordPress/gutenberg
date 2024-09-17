/**
 * Internal dependencies
 */
import { getQueriedItems } from '../selectors';

describe( 'getQueriedItems', () => {
	it( 'should return null if requesting but no item IDs', () => {
		const state = {
			items: {},
			itemIsComplete: {},
			queries: {},
		};

		const result = getQueriedItems( state );

		expect( result ).toBe( null );
	} );

	it( 'should return an array of items', () => {
		const state = {
			items: {
				default: {
					1: { id: 1 },
					2: { id: 2 },
				},
			},
			itemIsComplete: {
				default: {
					1: true,
					2: true,
				},
			},
			queries: {
				default: {
					'': { itemIds: [ 1, 2 ] },
				},
			},
		};

		const result = getQueriedItems( state );

		expect( result ).toEqual( [ { id: 1 }, { id: 2 } ] );
	} );

	it( 'should cache on query by state', () => {
		const state = {
			items: {
				default: {
					1: { id: 1 },
					2: { id: 2 },
				},
			},
			itemIsComplete: {
				default: {
					1: true,
					2: true,
				},
			},
			queries: { itemIds: [ 1, 2 ] },
		};

		const resultA = getQueriedItems( state, {} );
		const resultB = getQueriedItems( state, {} );

		expect( resultA ).toBe( resultB );
	} );

	it( 'should return items queried by include', () => {
		const state = {
			items: {
				default: {
					1: { id: 1 },
					2: { id: 2 },
				},
			},
			itemIsComplete: {
				default: {
					1: true,
					2: true,
				},
			},
			queries: {
				default: {
					'': { itemIds: [ 1, 2 ] },
					'include=1': { itemIds: [ 1 ] },
				},
			},
		};

		const result = getQueriedItems( state, { include: [ 1 ] } );

		expect( result ).toEqual( [ { id: 1 } ] );
	} );

	it( 'should dynamically construct fields-filtered item from available data', () => {
		const state = {
			items: {
				default: {
					1: {
						id: 1,
						content: 'chicken',
						author: 'bob',
					},
					2: {
						id: 2,
						content: 'ribs',
						author: 'sally',
					},
				},
			},
			itemIsComplete: {
				default: {
					1: true,
					2: true,
				},
			},
			queries: {
				default: {
					'_fields=content': { itemIds: [ 1, 2 ] },
				},
			},
		};

		const result = getQueriedItems( state, { _fields: [ 'content' ] } );

		expect( result ).toEqual( [
			{ content: 'chicken' },
			{ content: 'ribs' },
		] );
	} );

	it( 'should dynamically construct fields-filtered item from available data with nested fields', () => {
		const state = {
			items: {
				default: {
					1: {
						id: 1,
						content: 'chicken',
						author: 'bob',
						meta: {
							template: 'single',
							_private: 'unused',
						},
					},
					2: {
						id: 2,
						content: 'ribs',
						author: 'sally',
						meta: {
							template: 'single',
							_private: 'unused',
						},
					},
				},
			},
			itemIsComplete: {
				default: {
					1: true,
					2: true,
				},
			},
			queries: {
				default: {
					'_fields=content%2Cmeta.template': { itemIds: [ 1, 2 ] },
				},
			},
		};

		const result = getQueriedItems( state, {
			_fields: [ 'content', 'meta.template' ],
		} );

		expect( result ).toEqual( [
			{ content: 'chicken', meta: { template: 'single' } },
			{ content: 'ribs', meta: { template: 'single' } },
		] );
	} );

	it( 'should return null if attempting to filter by yet-unknown fields', () => {
		const state = {
			items: {
				default: {
					1: {
						id: 1,
						author: 'bob',
					},
					2: {
						id: 2,
						author: 'sally',
					},
				},
			},
			itemIsComplete: {
				default: {
					1: false,
					2: false,
				},
			},
			queries: {
				default: {
					'': { itemIds: [ 1, 2 ] },
				},
			},
		};

		const result = getQueriedItems( state, { _fields: [ 'content' ] } );

		expect( result ).toBe( null );
	} );

	it( 'should return null if querying non-filtered data for incomplete item', () => {
		const state = {
			items: {
				default: {
					1: {
						id: 1,
						author: 'bob',
					},
					2: {
						id: 2,
						author: 'sally',
					},
				},
			},
			itemIsComplete: {
				default: {
					1: false,
					2: false,
				},
			},
			queries: {
				default: {
					'': { itemIds: [ 1, 2 ] },
				},
			},
		};

		const result = getQueriedItems( state );

		expect( result ).toBe( null );
	} );
} );
