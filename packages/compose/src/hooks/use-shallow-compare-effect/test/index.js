/**
 * WordPress dependencies
 */
import React from '@wordpress/element';

/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useShallowCompareEffect from '../';

describe( 'useShallowCompareEffect', () => {
	it( 'should call the effect when the dependencies are not shallowly equal', () => {
		const effectCallback = jest.fn();

		let deps = [ 1, 2, 3 ];

		function TestComponent() {
			useShallowCompareEffect( effectCallback, deps );
			return null;
		}

		const { rerender } = render( <TestComponent /> );

		expect( effectCallback ).toHaveBeenCalledTimes( 1 );

		deps = [ 4, 5, 6 ];

		rerender( <TestComponent /> );

		expect( effectCallback ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should not call the effect when the dependencies are shallowly equal', () => {
		const effectCallback = jest.fn();

		let deps = [ 1, 2, 3 ];

		function TestComponent() {
			useShallowCompareEffect( effectCallback, deps );
			return null;
		}

		const { rerender } = render( <TestComponent /> );

		expect( effectCallback ).toHaveBeenCalledTimes( 1 );

		deps = [ 1, 2, 3 ]; // Different instance

		rerender( <TestComponent /> );

		expect( effectCallback ).toHaveBeenCalledTimes( 1 );
	} );
} );
