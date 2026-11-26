import { describe, expect, it } from 'vitest';
import { getQueriedItems } from '../selectors';
import type { QueriedDataState } from '../types';
import reducer, { getMergedItemIds } from '../reducer';
import { removeItems } from '../actions';

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
		const state: QueriedDataState< { id: number } > = {
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
			queries: { default: { '': { itemIds: [ 1, 2 ] } } },
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

		const result = getQueriedItems(
			state,
			{ per_page: 3 },
			{ supportsPagination: true }
		);
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
					'': {
						itemIds: getMergedItemIds( [], [ 101, 102, 103 ], {
							offset: 100,
							perPage: 50,
						} ),
						meta: { totalItems: 103 },
					},
				},
			},
		};

		const result = getQueriedItems(
			state,
			{ per_page: 50, offset: 100 },
			{ supportsPagination: true }
		);
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
					'': {
						itemIds: getMergedItemIds( [], [ 51, 52 ], {
							offset: 50,
							perPage: 50,
						} ),
						meta: { totalItems: 200 },
					},
				},
			},
		};

		const result = getQueriedItems(
			state,
			{ per_page: 50, offset: 50 },
			{ supportsPagination: true }
		);
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
					'': {
						itemIds: getMergedItemIds( [], [ 4, 5, 6, 7, 8 ], {
							offset: 3,
							perPage: 10,
						} ),
						meta: { totalItems: 50 },
					},
				},
			},
		};

		const result = getQueriedItems(
			state,
			{ per_page: 10, offset: 3 },
			{ supportsPagination: true }
		);
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
					'': {
						itemIds: [ 1, 2 ],
						meta: { totalItems: 5 },
					},
				},
			},
		};

		// 2 items stored, but 5 total exist — should return null.
		const result = getQueriedItems(
			state,
			{ per_page: 3, offset: 0 },
			{ supportsPagination: true }
		);
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
					'': {
						itemIds: getMergedItemIds( [], [], {
							offset: 84,
							perPage: 7,
						} ),
						meta: { totalItems: 84 },
					},
				},
			},
		};

		const result = getQueriedItems(
			state,
			{ per_page: 7, offset: 84 },
			{ supportsPagination: true }
		);
		expect( result ).toEqual( [] );
	} );

	it( 'should return items when a fetched page returns fewer items than X-WP-Total due to server-side filtering', () => {
		const state = reducer( undefined, {
			type: 'RECEIVE_ITEMS',
			query: { context: 'edit', search: 'Sample', per_page: 100 },
			items: [ { id: 2, title: 'Sample guide 2' } ],
			meta: { totalItems: 2, totalPages: 1 },
		} );

		const result = getQueriedItems(
			state,
			{ context: 'edit', search: 'Sample', per_page: 100 },
			{ supportsPagination: true }
		);
		expect( result ).toEqual( [ { id: 2, title: 'Sample guide 2' } ] );
	} );

	it( 'should return an empty array when a fetched page filters out all matching items', () => {
		const state = reducer( undefined, {
			type: 'RECEIVE_ITEMS',
			query: { context: 'edit', search: 'Sample', per_page: 100 },
			items: [],
			meta: { totalItems: 2, totalPages: 1 },
		} );

		const result = getQueriedItems(
			state,
			{ context: 'edit', search: 'Sample', per_page: 100 },
			{ supportsPagination: true }
		);
		expect( result ).toEqual( [] );
	} );

	it( 'should return items for a short fetched page while still returning null for unfetched pages or larger per_page', () => {
		// 25 total items, per_page=10. Page 1 returns 8 items (2 skipped by
		// server permissions). Page 1 is fulfilled, while page 2 and a larger
		// per_page must still return null until fetched.
		const page1Items = Array.from( { length: 8 }, ( _, i ) => ( {
			id: i + 1,
		} ) );
		let state = reducer( undefined, {
			type: 'RECEIVE_ITEMS',
			query: { context: 'edit', page: 1, per_page: 10 },
			items: page1Items,
			meta: { totalItems: 25, totalPages: 3 },
		} );

		expect(
			getQueriedItems(
				state,
				{ context: 'edit', page: 1, per_page: 10 },
				{ supportsPagination: true }
			)
		).toEqual( page1Items );

		expect(
			getQueriedItems(
				state,
				{ context: 'edit', page: 1, per_page: 20 },
				{ supportsPagination: true }
			)
		).toBe( null );

		expect(
			getQueriedItems(
				state,
				{ context: 'edit', page: 2, per_page: 10 },
				{ supportsPagination: true }
			)
		).toBe( null );

		// Fetch page 2 (9 items, 1 skipped). Page 2 and combined per_page=20
		// are now covered, while page 3 remains null.
		const page2Items = Array.from( { length: 9 }, ( _, i ) => ( {
			id: i + 11,
		} ) );
		state = reducer( state, {
			type: 'RECEIVE_ITEMS',
			query: { context: 'edit', page: 2, per_page: 10 },
			items: page2Items,
			meta: { totalItems: 25, totalPages: 3 },
		} );

		expect(
			getQueriedItems(
				state,
				{ context: 'edit', page: 2, per_page: 10 },
				{ supportsPagination: true }
			)
		).toEqual( page2Items );

		expect(
			getQueriedItems(
				state,
				{ context: 'edit', page: 1, per_page: 20 },
				{ supportsPagination: true }
			)
		).toEqual( [ ...page1Items, ...page2Items ] );

		expect(
			getQueriedItems(
				state,
				{ context: 'edit', page: 3, per_page: 10 },
				{ supportsPagination: true }
			)
		).toBe( null );
	} );

	it( 'should return null for a short last page once the total grows', () => {
		// Page 3 of 25 items returns the last 5.
		let state = reducer( undefined, {
			type: 'RECEIVE_ITEMS',
			query: { page: 3, per_page: 10 },
			items: Array.from( { length: 5 }, ( _, i ) => ( { id: i + 21 } ) ),
			meta: { totalItems: 25, totalPages: 3 },
		} );

		// A later fetch reports 2 more items.
		state = reducer( state, {
			type: 'RECEIVE_ITEMS',
			query: { page: 1, per_page: 10 },
			items: Array.from( { length: 10 }, ( _, i ) => ( { id: i + 1 } ) ),
			meta: { totalItems: 27, totalPages: 3 },
		} );

		expect(
			getQueriedItems(
				state,
				{ page: 3, per_page: 10 },
				{ supportsPagination: true }
			)
		).toBe( null );
	} );

	it( 'should return null for a short page received without a total once a total is known', () => {
		// Page 3 is received without pagination meta.
		let state = reducer( undefined, {
			type: 'RECEIVE_ITEMS',
			query: { page: 3, per_page: 10 },
			items: Array.from( { length: 5 }, ( _, i ) => ( { id: i + 21 } ) ),
		} );

		// A later fetch reports a total larger than the stored items.
		state = reducer( state, {
			type: 'RECEIVE_ITEMS',
			query: { page: 1, per_page: 10 },
			items: Array.from( { length: 10 }, ( _, i ) => ( { id: i + 1 } ) ),
			meta: { totalItems: 27, totalPages: 3 },
		} );

		expect(
			getQueriedItems(
				state,
				{ page: 3, per_page: 10 },
				{ supportsPagination: true }
			)
		).toBe( null );
	} );

	it( 'should return null after deleting an item from a full page when more items exist', () => {
		let state = reducer( undefined, {
			type: 'RECEIVE_ITEMS',
			query: { page: 1, per_page: 3 },
			items: [ { id: 1 }, { id: 2 }, { id: 3 } ],
			meta: { totalItems: 5, totalPages: 2 },
		} );

		state = reducer( state, removeItems( 'postType', 'post', 2 ) );

		expect(
			getQueriedItems(
				state,
				{ page: 1, per_page: 3 },
				{ supportsPagination: true }
			)
		).toBe( null );
	} );
} );
