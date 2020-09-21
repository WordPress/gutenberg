/**
 * WordPress dependencies
 */
import React, { useReducer } from '@wordpress/element';

/**
 * External dependencies
 */
import { render, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useLazyRef from '..';

describe( 'useLazyRef', () => {
	it( 'should lazily initialize the initializer only once', () => {
		const initializer = jest.fn( () => 87 );
		let result;
		let forceUpdate = () => {};

		function TestComponent() {
			const ref = useLazyRef( initializer );

			forceUpdate = useReducer( ( c ) => c + 1, 0 )[ 1 ];

			result = ref.current;

			return null;
		}

		render( <TestComponent /> );

		expect( initializer ).toHaveBeenCalledTimes( 1 );
		expect( result ).toBe( 87 );

		act( () => {
			forceUpdate();
		} );

		expect( initializer ).toHaveBeenCalledTimes( 1 );
		expect( result ).toBe( 87 );
	} );

	it( 'should not accept falsy values', () => {
		const initializer = jest.fn( () => 87 );
		let result;
		let ref = { current: null };
		let forceUpdate = () => {};

		function TestComponent() {
			ref = useLazyRef( initializer );

			forceUpdate = useReducer( ( c ) => c + 1, 0 )[ 1 ];

			result = ref.current;

			return null;
		}

		render( <TestComponent /> );

		expect( initializer ).toHaveBeenCalledTimes( 1 );
		expect( result ).toBe( 87 );

		ref.current = undefined;
		act( () => {
			forceUpdate();
		} );

		expect( initializer ).toHaveBeenCalledTimes( 1 );
		expect( result ).toBe( undefined );

		ref.current = null;
		act( () => {
			forceUpdate();
		} );

		expect( initializer ).toHaveBeenCalledTimes( 1 );
		expect( result ).toBe( null );
	} );
} );
