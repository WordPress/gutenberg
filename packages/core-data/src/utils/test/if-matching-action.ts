import { describe, expect, it } from 'vitest';
import deepFreeze from 'deep-freeze';
import ifMatchingAction from '../if-matching-action';

describe( 'ifMatchingAction', () => {
	function createEnhancedReducer(
		predicate: ( action: unknown ) => boolean
	) {
		const enhanceReducer = ifMatchingAction( predicate );
		return enhanceReducer( (): unknown => 'Called' );
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
