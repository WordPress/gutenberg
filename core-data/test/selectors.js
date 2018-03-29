/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	getTerms,
	isRequestingTerms,
	getMedia,
	getPostType,
	getUserPostTypeCapability,
} from '../selectors';

describe( 'getTerms()', () => {
	it( 'returns value of terms by taxonomy', () => {
		let state = deepFreeze( {
			terms: {},
		} );
		expect( getTerms( state, 'categories' ) ).toBe( undefined );

		state = deepFreeze( {
			terms: {
				categories: [ { id: 1 } ],
			},
		} );
		expect( getTerms( state, 'categories' ) ).toEqual( [ { id: 1 } ] );
	} );
} );

describe( 'isRequestingTerms()', () => {
	it( 'returns false if never requested', () => {
		const state = deepFreeze( {
			terms: {},
		} );

		const result = isRequestingTerms( state, 'categories' );
		expect( result ).toBe( false );
	} );

	it( 'returns false if terms received', () => {
		const state = deepFreeze( {
			terms: {
				categories: [ { id: 1 } ],
			},
		} );

		const result = isRequestingTerms( state, 'categories' );
		expect( result ).toBe( false );
	} );

	it( 'returns true if requesting', () => {
		const state = deepFreeze( {
			terms: {
				categories: null,
			},
		} );

		const result = isRequestingTerms( state, 'categories' );
		expect( result ).toBe( true );
	} );
} );

describe( 'getMedia', () => {
	it( 'should return undefined for unknown media', () => {
		const state = deepFreeze( {
			media: {},
		} );
		expect( getMedia( state, 1 ) ).toBe( undefined );
	} );

	it( 'should return a media element by id', () => {
		const state = deepFreeze( {
			media: {
				1: { id: 1 },
			},
		} );
		expect( getMedia( state, 1 ) ).toEqual( { id: 1 } );
	} );
} );

describe( 'getPostType', () => {
	it( 'should return undefined for unknown post type', () => {
		const state = deepFreeze( {
			postTypes: {},
		} );
		expect( getPostType( state, 'post' ) ).toBe( undefined );
	} );

	it( 'should return a post type by slug', () => {
		const state = deepFreeze( {
			postTypes: {
				post: { slug: 'post' },
			},
		} );
		expect( getPostType( state, 'post' ) ).toEqual( { slug: 'post' } );
	} );
} );

describe( 'getUserPostTypeCapability', () => {
	it( 'should return undefined for unknown post type', () => {
		const state = deepFreeze( {
			userPostTypeCapabilities: {},
		} );
		expect( getUserPostTypeCapability( state, 'post', 'publishPost' ) ).toBe( undefined );
	} );

	it( 'should return false for unknown capability', () => {
		const state = deepFreeze( {
			userPostTypeCapabilities: {
				post: {
					hasPost: false,
				},
			},
		} );
		expect( getUserPostTypeCapability( state, 'post', 'publishPost' ) ).toBe( false );
	} );

	it( 'should return the capability value', () => {
		const state = deepFreeze( {
			userPostTypeCapabilities: {
				post: {
					publishPost: true,
				},
			},
		} );
		expect( getUserPostTypeCapability( state, 'post', 'publishPost' ) ).toBe( true );
	} );
} );
