/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { getTerms, isRequestingTerms, getMedia, getModelRecord } from '../selectors';

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

describe( 'getModelRecord', () => {
	it( 'should return undefined for unknown record Primary Key', () => {
		const state = deepFreeze( {
			models: {
				root: {
					postType: {
						byPrimaryKey: {},
					},
				},
			},
		} );
		expect( getModelRecord( state, 'root', 'postType', 'post' ) ).toBe( undefined );
	} );

	it( 'should return a record by Primary Key', () => {
		const state = deepFreeze( {
			models: {
				root: {
					postType: {
						byPrimaryKey: {
							post: { slug: 'post' },
						},
					},
				},
			},
		} );
		expect( getModelRecord( state, 'root', 'postType', 'post' ) ).toEqual( { slug: 'post' } );
	} );
} );
