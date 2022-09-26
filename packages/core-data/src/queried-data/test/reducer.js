/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reducer, { getMergedItemIds, itemIsComplete } from '../reducer';
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

describe( 'reducer', () => {
	it( 'returns a default value of its combined keys defaults', () => {
		const state = reducer( undefined, {} );

		expect( state ).toEqual( {
			items: {},
			queries: {},
			itemIsComplete: {},
		} );
	} );

	it( 'receives a page of queried data', () => {
		const original = deepFreeze( {
			items: { default: {} },
			queries: {},
			itemIsComplete: { default: {} },
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
				default: { 's=a': [ 1 ] },
			},
		} );
	} );

	it( 'receives an unqueried page of items', () => {
		const original = deepFreeze( {
			items: { default: {} },
			queries: {},
			itemIsComplete: { default: {} },
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
					'': [ 1, 2, 3, 4 ],
					's=a': [ 1, 3 ],
				},
			},
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
					'': [ 1, 2, 4 ],
					's=a': [ 1 ],
				},
			},
		} );
	} );
} );
