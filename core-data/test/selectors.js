/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	isRequested,
	isRequesting,
	getTerms,
	isRequestingTerms,
	getMedia,
	getPostType,
} from '../selectors';

describe( 'isRequesting', () => {
	it( 'returns false if never requested', () => {
		const state = deepFreeze( {
			requests: { terms: {} },
		} );

		const result = isRequesting( state, 'terms', 'categories' );
		expect( result ).toBe( false );
	} );

	it( 'returns false if requested', () => {
		const state = deepFreeze( {
			requests: { terms: {
				categories: {
					isRequested: true,
					isRequesting: false,
				},
			} },
		} );

		const result = isRequesting( state, 'terms', 'categories' );
		expect( result ).toBe( false );
	} );

	it( 'returns true if requesting', () => {
		const state = deepFreeze( {
			requests: { terms: {
				categories: {
					isRequesting: true,
				},
			} },
		} );

		const result = isRequesting( state, 'terms', 'categories' );
		expect( result ).toBe( true );
	} );
} );

describe( 'isRequested', () => {
	it( 'returns false if never requested', () => {
		const state = deepFreeze( {
			requests: { terms: {} },
		} );

		const result = isRequested( state, 'terms', 'categories' );
		expect( result ).toBe( false );
	} );

	it( 'returns true if requested', () => {
		const state = deepFreeze( {
			requests: { terms: {
				categories: {
					isRequested: true,
					isRequesting: false,
				},
			} },
		} );

		const result = isRequested( state, 'terms', 'categories' );
		expect( result ).toBe( true );
	} );

	it( 'returns false if requesting', () => {
		const state = deepFreeze( {
			requests: { terms: {
				categories: {
					isRequesting: true,
				},
			} },
		} );

		const result = isRequested( state, 'terms', 'categories' );
		expect( result ).toBe( false );
	} );
} );

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
	it( 'returns true if requesting', () => {
		const state = deepFreeze( {
			requests: { terms: {
				categories: {
					isRequesting: true,
				},
			} },
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
