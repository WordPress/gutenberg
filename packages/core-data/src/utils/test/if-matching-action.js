/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import ifMatchingAction from '../if-matching-action';

describe( 'ifMatchingAction', () => {
	function createEnhancedReducer( predicate ) {
		const enhanceReducer = ifMatchingAction( predicate );
		return enhanceReducer( () => 'Called' );
	}

	it( 'should call reducer if predicate returns true', () => {
		const reducer = createEnhancedReducer( () => true );
		const nextState = reducer( 'Not Called', { type: '@@INIT' } );

		expect( nextState ).toBe( 'Called' );
	} );

	it( 'should not call reducer if predicate returns false', () => {
		const state = deepFreeze( {} );
		const reducer = createEnhancedReducer( () => false );
		const nextState = reducer( state, { type: 'DO_FOO' } );

		expect( nextState ).toBe( state );
	} );
} );
