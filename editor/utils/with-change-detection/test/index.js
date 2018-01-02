/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import withChangeDetection from '../';

describe( 'withChangeDetection()', () => {
	const initialState = deepFreeze( { count: 0 } );

	function originalReducer( state = initialState, action ) {
		switch ( action.type ) {
			case 'INCREMENT':
				return { ...state, count: state.count + 1 };

			case 'RESET_AND_CHANGE_REFERENCE':
				return { ...state };
		}

		return state;
	}

	it( 'should respect original reducer behavior', () => {
		const reducer = withChangeDetection( originalReducer );

		const state = reducer( undefined, {} );
		expect( state ).toEqual( { count: 0, isDirty: false } );

		const nextState = reducer( deepFreeze( state ), { type: 'INCREMENT' } );
		expect( nextState ).not.toBe( state );
		expect( nextState ).toEqual( { count: 1, isDirty: true } );
	} );

	it( 'should allow reset types as option', () => {
		const reducer = withChangeDetection( originalReducer, { resetTypes: [ 'RESET' ] } );

		let state;

		state = reducer( undefined, {} );
		expect( state ).toEqual( { count: 0, isDirty: false } );

		state = reducer( deepFreeze( state ), { type: 'INCREMENT' } );
		expect( state ).toEqual( { count: 1, isDirty: true } );

		state = reducer( deepFreeze( state ), { type: 'RESET' } );
		expect( state ).toEqual( { count: 1, isDirty: false } );
	} );

	it( 'should preserve isDirty into non-resetting non-reference-changing types', () => {
		const reducer = withChangeDetection( originalReducer, { resetTypes: [ 'RESET' ] } );

		let state;

		state = reducer( undefined, {} );
		expect( state ).toEqual( { count: 0, isDirty: false } );

		state = reducer( deepFreeze( state ), { type: 'INCREMENT' } );
		expect( state ).toEqual( { count: 1, isDirty: true } );

		state = reducer( deepFreeze( state ), {} );
		expect( state ).toEqual( { count: 1, isDirty: true } );
	} );

	it( 'should maintain separate states', () => {
		const reducer = withChangeDetection( originalReducer );

		let firstState;

		firstState = reducer( undefined, {} );
		expect( firstState ).toEqual( { count: 0, isDirty: false } );

		const secondState = reducer( undefined, { type: 'INCREMENT' } );
		expect( secondState ).toEqual( { count: 1, isDirty: false } );

		firstState = reducer( deepFreeze( firstState ), {} );
		expect( firstState ).toEqual( { count: 0, isDirty: false } );
	} );

	it( 'should flag as not dirty even if reset type causes reference change', () => {
		const reducer = withChangeDetection( originalReducer, { resetTypes: [ 'RESET_AND_CHANGE_REFERENCE' ] } );

		let state;

		state = reducer( undefined, {} );
		expect( state ).toEqual( { count: 0, isDirty: false } );

		state = reducer( deepFreeze( state ), { type: 'INCREMENT' } );
		expect( state ).toEqual( { count: 1, isDirty: true } );

		state = reducer( deepFreeze( state ), { type: 'RESET_AND_CHANGE_REFERENCE' } );
		expect( state ).toEqual( { count: 1, isDirty: false } );
	} );
} );
