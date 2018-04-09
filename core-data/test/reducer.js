/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { requests, terms, media, postTypes } from '../reducer';

describe( 'requests', () => {
	it( 'returns an empty object by default', () => {
		const state = requests( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'returns an object with isRequesting to true', () => {
		const originalState = deepFreeze( {} );
		const state = requests( originalState, {
			type: 'SET_REQUESTING',
			dataType: 'terms',
			id: 'categories',
		} );

		expect( state ).toEqual( {
			terms: { categories: { isRequesting: true } },
		} );
	} );

	it( 'returns an object with isRequested to true', () => {
		const originalState = deepFreeze( {
			terms: {
				tag: { isRequesting: true },
				categories: { isRequesting: true },
			},
		} );
		const state = requests( originalState, {
			type: 'SET_REQUESTED',
			dataType: 'terms',
			id: 'categories',
		} );

		expect( state ).toEqual( {
			terms: {
				tag: { isRequesting: true },
				categories: { isRequesting: false, isRequested: true },
			},
		} );
	} );
} );

describe( 'terms()', () => {
	it( 'returns an empty object by default', () => {
		const state = terms( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'returns with received terms', () => {
		const originalState = deepFreeze( {} );
		const state = terms( originalState, {
			type: 'RECEIVE_TERMS',
			taxonomy: 'categories',
			terms: [ { id: 1 } ],
		} );

		expect( state ).toEqual( {
			categories: [ { id: 1 } ],
		} );
	} );
} );

describe( 'media', () => {
	it( 'returns an empty object by default', () => {
		const state = media( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'returns with received media by id', () => {
		const originalState = deepFreeze( {} );
		const state = media( originalState, {
			type: 'RECEIVE_MEDIA',
			media: [ { id: 1, title: 'beach' }, { id: 2, title: 'sun' } ],
		} );

		expect( state ).toEqual( {
			1: { id: 1, title: 'beach' },
			2: { id: 2, title: 'sun' },
		} );
	} );
} );

describe( 'postTypes', () => {
	it( 'returns an empty object by default', () => {
		const state = postTypes( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'returns with received post types by slug', () => {
		const originalState = deepFreeze( {} );
		const state = postTypes( originalState, {
			type: 'RECEIVE_POST_TYPES',
			postTypes: [ { slug: 'b', title: 'beach' }, { slug: 's', title: 'sun' } ],
		} );

		expect( state ).toEqual( {
			b: { slug: 'b', title: 'beach' },
			s: { slug: 's', title: 'sun' },
		} );
	} );
} );
