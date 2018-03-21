/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { terms } from '../reducer';

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
