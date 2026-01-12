/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reducer, {
	getMergedItemIds,
	itemIsComplete,
	persistedIdMap,
} from '../reducer';
import { removeItems } from '../actions';

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

		expect( result ).toEqual( [ 1, 2, 3, 4, 5, 6 ] );
	} );

	it( 'should replace with new page', () => {
		const original = deepFreeze( [ 1, 2, 3, 4, 5, 6 ] );
		const result = getMergedItemIds( original, [ 'replaced', 5, 6 ], 2, 3 );

		expect( result ).toEqual( [ 1, 2, 3, 'replaced', 5, 6 ] );
	} );

	it( 'should append a new partial page', () => {
		const original = deepFreeze( [ 1, 2, 3, 4, 5, 6 ] );
		const result = getMergedItemIds( original, [ 7 ], 3, 3 );

		expect( result ).toEqual( [ 1, 2, 3, 4, 5, 6, 7 ] );
	} );

	it( 'should return a copy of nextItemIds if it represents all ids (single id removed) (page=1 and perPage=-1)', () => {
		const original = deepFreeze( [ 1, 2, 3 ] );
		const result = getMergedItemIds( original, [ 1, 3 ], 1, -1 );

		expect( result ).toEqual( [ 1, 3 ] );
	} );

	it( 'should return a copy of nextItemIds if it represents all ids (single id removed and another one added) (page=1 and perPage=-1)', () => {
		const original = deepFreeze( [ 1, 2, 3 ] );
		const result = getMergedItemIds( original, [ 1, 3, 4 ], 1, -1 );

		expect( result ).toEqual( [ 1, 3, 4 ] );
	} );
	it( 'should update a page properly if less items are provided than previously stored', () => {
		let original = deepFreeze( [ 1, 2, 3 ] );
		let result = getMergedItemIds( original, [ 1, 2 ], 1, 3 );

		expect( result ).toEqual( [ 1, 2 ] );

		original = deepFreeze( [ 1, 2, 3, 4, 5, 6 ] );
		result = getMergedItemIds( original, [ 9 ], 2, 2 );

		expect( result ).toEqual( [ 1, 2, 9, undefined, 5, 6 ] );
	} );
} );

describe( 'itemIsComplete', () => {
	it( 'should assign received items as complete if no associated query', () => {
		const original = deepFreeze( {} );
		const state = itemIsComplete( original, {
			type: 'RECEIVE_ITEMS',
			items: [ { id: 1, content: 'chicken', author: 'bob' } ],
		} );

		expect( state ).toEqual( {
			default: { 1: true },
		} );
	} );

	it( 'should assign received items as complete if non-fields-filtering query', () => {
		const original = deepFreeze( {} );
		const state = itemIsComplete( original, {
			type: 'RECEIVE_ITEMS',
			query: {
				per_page: 5,
				context: 'edit',
			},
			items: [ { id: 1, content: 'chicken', author: 'bob' } ],
		} );

		expect( state ).toEqual( {
			edit: { 1: true },
		} );
	} );

	it( 'should assign received items as incomplete if fields-filtering query', () => {
		const original = deepFreeze( {} );
		const state = itemIsComplete( original, {
			type: 'RECEIVE_ITEMS',
			query: {
				_fields: 'content',
			},
			items: [ { id: 1, content: 'chicken' } ],
		} );

		expect( state ).toEqual( {
			default: { 1: false },
		} );
	} );

	it( 'should defer to existing completeness when receiving filtered query', () => {
		const original = deepFreeze( {
			default: { 1: true },
		} );
		const state = itemIsComplete( original, {
			type: 'RECEIVE_ITEMS',
			query: {
				_fields: 'content',
			},
			items: [ { id: 1, content: 'chicken' } ],
		} );

		expect( state ).toEqual( {
			default: { 1: true },
		} );
	} );
} );

describe( 'persistedIdMap', () => {
	it( 'should return empty object by default', () => {
		const state = persistedIdMap( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'should create mapping when item has __unstablePersistedId', () => {
		const original = deepFreeze( {} );
		const state = persistedIdMap( original, {
			type: 'RECEIVE_ITEMS',
			items: [
				{
					id: '__staged__1',
					name: 'Staged Item',
					__unstablePersistedId: 10,
				},
			],
		} );

		expect( state ).toEqual( {
			default: {
				10: '__staged__1',
			},
		} );
	} );

	it( 'should not update state when items do not have __unstablePersistedId', () => {
		const original = deepFreeze( {} );
		const state = persistedIdMap( original, {
			type: 'RECEIVE_ITEMS',
			items: [ { id: 1, name: 'Regular Item' } ],
		} );

		expect( state ).toBe( original );
	} );

	it( 'should remove mappings when items are removed', () => {
		const original = deepFreeze( {
			default: {
				10: '__staged__1',
				20: '__staged__2',
				30: 3,
			},
			edit: {
				10: '__staged__1',
			},
		} );
		const state = persistedIdMap( original, {
			type: 'REMOVE_ITEMS',
			itemIds: [ '__staged__1' ],
		} );

		expect( state ).toEqual( {
			default: {
				20: '__staged__2',
				30: 3,
			},
			edit: {},
		} );
	} );

	it( 'should use custom key when provided', () => {
		const original = deepFreeze( {} );
		const state = persistedIdMap( original, {
			type: 'RECEIVE_ITEMS',
			key: 'slug',
			items: [
				{
					slug: 'staged-post',
					name: 'Staged Post',
					__unstablePersistedId: 'original-slug',
				},
			],
		} );

		expect( state ).toEqual( {
			default: {
				'original-slug': 'staged-post',
			},
		} );
	} );
} );

describe( 'reducer', () => {
	it( 'returns a default value of its combined keys defaults', () => {
		const state = reducer( undefined, {} );

		expect( state ).toEqual( {
			items: {},
			queries: {},
			itemIsComplete: {},
			persistedIdMap: {},
		} );
	} );

	it( 'receives a page of queried data', () => {
		const original = deepFreeze( {
			items: { default: {} },
			queries: {},
			itemIsComplete: { default: {} },
			persistedIdMap: {},
		} );
		const state = reducer( original, {
			type: 'RECEIVE_ITEMS',
			query: { s: 'a', page: 1, per_page: 3 },
			items: [ { id: 1, name: 'abc' } ],
		} );

		expect( state ).toEqual( {
			items: {
				default: { 1: { id: 1, name: 'abc' } },
			},
			itemIsComplete: {
				default: { 1: true },
			},
			queries: {
				default: { 's=a': { itemIds: [ 1 ], meta: undefined } },
			},
			persistedIdMap: {},
		} );
	} );

	it( 'receives an unqueried page of items', () => {
		const original = deepFreeze( {
			items: { default: {} },
			queries: {},
			itemIsComplete: { default: {} },
			persistedIdMap: {},
		} );
		const state = reducer( original, {
			type: 'RECEIVE_ITEMS',
			items: [ { id: 1, name: 'abc' } ],
		} );

		expect( state ).toEqual( {
			items: {
				default: { 1: { id: 1, name: 'abc' } },
			},
			itemIsComplete: {
				default: { 1: true },
			},
			queries: {},
			persistedIdMap: {},
		} );
	} );

	it( 'deletes an item', () => {
		const kind = 'root';
		const name = 'menu';
		const original = deepFreeze( {
			items: {
				default: {
					1: { id: 1, name: 'abc' },
					2: { id: 2, name: 'def' },
					3: { id: 3, name: 'ghi' },
					4: { id: 4, name: 'klm' },
				},
			},
			queries: {
				default: {
					'': { itemIds: [ 1, 2, 3, 4 ] },
					's=a': { itemIds: [ 1, 3 ] },
				},
			},
			persistedIdMap: {},
		} );
		const state = reducer( original, removeItems( kind, name, 3 ) );

		expect( state ).toEqual( {
			itemIsComplete: {},
			items: {
				default: {
					1: { id: 1, name: 'abc' },
					2: { id: 2, name: 'def' },
					4: { id: 4, name: 'klm' },
				},
			},
			queries: {
				default: {
					'': { itemIds: [ 1, 2, 4 ] },
					's=a': { itemIds: [ 1 ] },
				},
			},
			persistedIdMap: {},
		} );
	} );

	it( 'deletes an item with string ID', () => {
		const kind = 'postType';
		const name = 'wp_template';
		const original = deepFreeze( {
			items: {
				default: {
					'foo//bar1': { id: 'foo//bar1', name: 'Foo Bar 1' },
					'foo//bar2': { id: 'foo//bar2', name: 'Foo Bar 2' },
					'foo//bar3': { id: 'foo//bar3', name: 'Foo Bar 3' },
				},
			},
			queries: {
				default: {
					'': { itemIds: [ 'foo//bar1', 'foo//bar2', 'foo//bar3' ] },
					's=2': { itemIds: [ 'foo//bar2' ] },
				},
			},
			persistedIdMap: {},
		} );
		const state = reducer(
			original,
			removeItems( kind, name, 'foo//bar2' )
		);

		expect( state ).toEqual( {
			itemIsComplete: {},
			items: {
				default: {
					'foo//bar1': { id: 'foo//bar1', name: 'Foo Bar 1' },
					'foo//bar3': { id: 'foo//bar3', name: 'Foo Bar 3' },
				},
			},
			queries: {
				default: {
					'': { itemIds: [ 'foo//bar1', 'foo//bar3' ] },
					's=2': { itemIds: [] },
				},
			},
			persistedIdMap: {},
		} );
	} );
} );
