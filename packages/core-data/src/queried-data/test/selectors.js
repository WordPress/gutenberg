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

	it( 'should map persisted IDs to local staged IDs', () => {
		const state = {
			items: {
				default: {
					__staged__1: {
						id: '__staged__1',
						title: 'Staged',
						__unstablePersistedId: 10,
					},
				},
			},
			itemIsComplete: {
				default: {
					__staged__1: true,
				},
			},
			queries: {
				default: {
					'': { itemIds: [ 10 ] },
				},
			},
			persistedIdMap: {
				default: {
					10: '__staged__1',
				},
			},
		};

		const result = getQueriedItems( state );

		expect( result ).toEqual( [
			{
				id: '__staged__1',
				title: 'Staged',
				__unstablePersistedId: 10,
			},
		] );
	} );

	it( 'should map include parameter with persisted IDs to staged IDs', () => {
		const state = {
			items: {
				default: {
					__staged__1: {
						id: '__staged__1',
						title: 'Staged Post',
						__unstablePersistedId: 10,
					},
					2: {
						id: 2,
						title: 'Regular Post',
					},
				},
			},
			itemIsComplete: {
				default: {
					__staged__1: true,
					2: true,
				},
			},
			queries: {
				default: {
					'include=10': { itemIds: [ 10 ] },
				},
			},
			persistedIdMap: {
				default: {
					10: '__staged__1',
				},
			},
		};

		// Query with include using the persisted ID (10), should find staged record
		const result = getQueriedItems( state, { include: [ 10 ] } );

		expect( result ).toEqual( [
			{
				id: '__staged__1',
				title: 'Staged Post',
				__unstablePersistedId: 10,
			},
		] );
	} );

	it( 'should work without persistedIdMap (backwards compatibility)', () => {
		const state = {
			items: {
				default: {
					1: { id: 1, title: 'Post 1' },
					2: { id: 2, title: 'Post 2' },
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
			// No persistedIdMap
		};

		const result = getQueriedItems( state );

		expect( result ).toEqual( [
			{ id: 1, title: 'Post 1' },
			{ id: 2, title: 'Post 2' },
		] );
	} );

	it( 'should handle mixed staged and regular items in query results', () => {
		const state = {
			items: {
				default: {
					__staged__1: {
						id: '__staged__1',
						title: 'Staged Post',
						__unstablePersistedId: 10,
					},
					2: {
						id: 2,
						title: 'Regular Post',
					},
				},
			},
			itemIsComplete: {
				default: {
					__staged__1: true,
					2: true,
				},
			},
			queries: {
				default: {
					'': { itemIds: [ 10, 2 ] },
				},
			},
			persistedIdMap: {
				default: {
					10: '__staged__1',
				},
			},
		};

		const result = getQueriedItems( state );

		expect( result ).toEqual( [
			{
				id: '__staged__1',
				title: 'Staged Post',
				__unstablePersistedId: 10,
			},
			{ id: 2, title: 'Regular Post' },
		] );
	} );

	it( 'should handle empty persistedIdMap for context', () => {
		const state = {
			items: {
				default: {
					1: { id: 1, title: 'Post' },
				},
			},
			itemIsComplete: {
				default: {
					1: true,
				},
			},
			queries: {
				default: {
					'': { itemIds: [ 1 ] },
				},
			},
			persistedIdMap: {
				// Empty for default context
				default: {},
			},
		};

		const result = getQueriedItems( state );

		expect( result ).toEqual( [ { id: 1, title: 'Post' } ] );
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
