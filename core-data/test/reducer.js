/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { terms, media, postTypes, userPostTypeCapabilities } from '../reducer';

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

	it( 'assigns requested taxonomy to null', () => {
		const originalState = deepFreeze( {} );
		const state = terms( originalState, {
			type: 'SET_REQUESTED',
			dataType: 'terms',
			subType: 'categories',
		} );

		expect( state ).toEqual( {
			categories: null,
		} );
	} );

	it( 'does not assign requested taxonomy to null if received', () => {
		const originalState = deepFreeze( {
			categories: [ { id: 1 } ],
		} );
		const state = terms( originalState, {
			type: 'SET_REQUESTED',
			dataType: 'terms',
			subType: 'categories',
		} );

		expect( state ).toEqual( {
			categories: [ { id: 1 } ],
		} );
	} );

	it( 'does not assign requested taxonomy if not terms data type', () => {
		const originalState = deepFreeze( {} );
		const state = terms( originalState, {
			type: 'SET_REQUESTED',
			dataType: 'foo',
			subType: 'categories',
		} );

		expect( state ).toEqual( {} );
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

describe( 'userPostTypeCapabilities', () => {
	it( 'returns an empty object by default', () => {
		const state = userPostTypeCapabilities( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'returns with received capabilities by slug', () => {
		const originalState = deepFreeze( {
			page: {
				editPost: false,
			},
		} );
		const state = userPostTypeCapabilities( originalState, {
			type: 'RECEIVE_USER_POST_TYPE_CAPABILITIES',
			postTypeSlug: 'post',
			capabilities: {
				publishPost: true,
			},
		} );

		expect( state ).toEqual( {
			page: { editPost: false },
			post: { publishPost: true },
		} );
	} );
} );
