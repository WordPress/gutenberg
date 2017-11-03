/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import dirtyingReducer from '../';

describe( 'dirtyingReducer()', () => {
	const initialState = { count: 0 };

	function originalReducer( state = initialState, action ) {
		switch ( action.type ) {
			case 'INCREMENT':
				return { ...state, count: state.count + 1 };

			case 'RESET_AND_CHANGE_REFERENCE':
				return { ...state };

			case 'SET_STATE':
				return action.state;
		}

		return state;
	}

	it( 'should respect original reducer behavior', () => {
		const reducer = dirtyingReducer( originalReducer );

		const state = reducer( undefined, {} );
		expect( state ).toEqual( { count: 0, isDirty: false } );

		const nextState = reducer( deepFreeze( state ), { type: 'INCREMENT' } );
		expect( nextState ).not.toBe( state );
		expect( nextState ).toEqual( { count: 1, isDirty: true } );
	} );

	it( 'should allow reset types as option', () => {
		const reducer = dirtyingReducer( originalReducer, { resetTypes: [ 'RESET' ] } );

		let state;

		state = reducer( undefined, {} );
		expect( state ).toEqual( { count: 0, isDirty: false } );

		state = reducer( deepFreeze( state ), { type: 'INCREMENT' } );
		expect( state ).toEqual( { count: 1, isDirty: true } );

		state = reducer( deepFreeze( state ), { type: 'RESET' } );
		expect( state ).toEqual( { count: 1, isDirty: false } );
	} );

	it( 'should preserve isDirty into non-resetting non-reference-changing types', () => {
		const reducer = dirtyingReducer( originalReducer, { resetTypes: [ 'RESET' ] } );

		let state;

		state = reducer( undefined, {} );
		expect( state ).toEqual( { count: 0, isDirty: false } );

		state = reducer( deepFreeze( state ), { type: 'INCREMENT' } );
		expect( state ).toEqual( { count: 1, isDirty: true } );

		state = reducer( deepFreeze( state ), {} );
		expect( state ).toEqual( { count: 1, isDirty: true } );
	} );

	it( 'should reset if state reverts to its original reference', () => {
		const reducer = dirtyingReducer( originalReducer, { resetTypes: [ 'RESET' ] } );

		let state;

		const originalState = state = reducer( undefined, {} );
		expect( state ).toEqual( { count: 0, isDirty: false } );

		state = reducer( deepFreeze( state ), { type: 'INCREMENT' } );
		expect( state ).toEqual( { count: 1, isDirty: true } );

		state = reducer( deepFreeze( state ), { type: 'SET_STATE', state: originalState } );
		expect( state ).toEqual( { count: 0, isDirty: false } );
	} );

	it( 'should flag as not dirty even if reset type causes reference change', () => {
		const reducer = dirtyingReducer( originalReducer, { resetTypes: [ 'RESET_AND_CHANGE_REFERENCE' ] } );

		let state;

		state = reducer( undefined, {} );
		expect( state ).toEqual( { count: 0, isDirty: false } );

		state = reducer( deepFreeze( state ), { type: 'INCREMENT' } );
		expect( state ).toEqual( { count: 1, isDirty: true } );

		state = reducer( deepFreeze( state ), { type: 'RESET_AND_CHANGE_REFERENCE' } );
		expect( state ).toEqual( { count: 1, isDirty: false } );
	} );
} );
