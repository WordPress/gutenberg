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

	it( 'should return null when per_page exceeds stored itemIds and more items exist', () => {
		const state = {
			items: {
				default: {
					1: { id: 1 },
					2: { id: 2 },
				},
			},
			itemIsComplete: {
				default: { 1: true, 2: true },
			},
			queries: {
				default: {
					'': {
						itemIds: [ 1, 2 ],
						meta: { totalItems: 5 },
					},
				},
			},
		};

		const result = getQueriedItems( state, { per_page: 3 } );
		expect( result ).toBe( null );
	} );

	it( 'should return items for offset-based query on the last partial page', () => {
		// Infinite scroll scenario: 103 total items, perPage=50, and the
		// last batch starts at offset=100. The API returns 3 items (items
		// 101-103). X-WP-Total is 103 (the global count). The selector
		// should recognise this as a complete response since
		// 103 - 100 = 3 expected items.
		const state = {
			items: {
				default: {
					101: { id: 101 },
					102: { id: 102 },
					103: { id: 103 },
				},
			},
			itemIsComplete: {
				default: { 101: true, 102: true, 103: true },
			},
			queries: {
				default: {
					'offset=100': {
						itemIds: [ 101, 102, 103 ],
						meta: { totalItems: 103 },
					},
				},
			},
		};

		const result = getQueriedItems( state, {
			per_page: 50,
			offset: 100,
		} );
		expect( result ).toEqual( [ { id: 101 }, { id: 102 }, { id: 103 } ] );
	} );

	it( 'should return null for offset-based query when items are still missing', () => {
		// Offset=50, perPage=50, totalItems=200: the API should return
		// 50 items for this batch but only 2 are stored so far.
		const state = {
			items: {
				default: {
					51: { id: 51 },
					52: { id: 52 },
				},
			},
			itemIsComplete: {
				default: { 51: true, 52: true },
			},
			queries: {
				default: {
					'offset=50': {
						itemIds: [ 51, 52 ],
						meta: { totalItems: 200 },
					},
				},
			},
		};

		const result = getQueriedItems( state, {
			per_page: 50,
			offset: 50,
		} );
		expect( result ).toBe( null );
	} );

	it( 'should return null for offset query when items are still missing', () => {
		// Query Block scenario: offset=3 with per_page=10. The effective
		// total is totalItems - offset = 47. Only 5 items are stored, so
		// the data is still incomplete.
		const state = {
			items: {
				default: {
					4: { id: 4 },
					5: { id: 5 },
					6: { id: 6 },
					7: { id: 7 },
					8: { id: 8 },
				},
			},
			itemIsComplete: {
				default: { 4: true, 5: true, 6: true, 7: true, 8: true },
			},
			queries: {
				default: {
					'offset=3': {
						itemIds: [ 4, 5, 6, 7, 8 ],
						meta: { totalItems: 50 },
					},
				},
			},
		};

		const result = getQueriedItems( state, {
			per_page: 10,
			offset: 3,
		} );
		expect( result ).toBe( null );
	} );

	it( 'should treat offset=0 the same as no offset', () => {
		// The Query Block defaults to offset=0. Since
		// effectiveTotal = totalItems - 0 = totalItems, this should
		// behave identically to a query without offset.
		const state = {
			items: {
				default: {
					1: { id: 1 },
					2: { id: 2 },
				},
			},
			itemIsComplete: {
				default: { 1: true, 2: true },
			},
			queries: {
				default: {
					'offset=0': {
						itemIds: [ 1, 2 ],
						meta: { totalItems: 5 },
					},
				},
			},
		};

		// 2 items stored, but 5 total exist — should return null.
		const result = getQueriedItems( state, {
			per_page: 3,
			offset: 0,
		} );
		expect( result ).toBe( null );
	} );

	it( 'should return empty array when offset equals totalItems', () => {
		// Edge case: offset lands exactly at the end (e.g. 84 items,
		// per_page=7, offset=84). The API returns 0 items and that is
		// a complete response — effectiveTotal is 0.
		const state = {
			items: {
				default: {},
			},
			itemIsComplete: {
				default: {},
			},
			queries: {
				default: {
					'offset=84': {
						itemIds: [],
						meta: { totalItems: 84 },
					},
				},
			},
		};

		const result = getQueriedItems( state, {
			per_page: 7,
			offset: 84,
		} );
		expect( result ).toEqual( [] );
	} );
} );
