/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { getTerms, isRequestingTerms } from '../selectors';

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
