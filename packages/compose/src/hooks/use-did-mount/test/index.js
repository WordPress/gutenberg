/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import React, { Component, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useDidMount from '../';

describe( 'useDidMount', () => {
	it( 'should call the effect when did mount', () => {
		const mountEffect = jest.fn();

		function TestComponent() {
			useDidMount( mountEffect );
			return null;
		}

		render( <TestComponent /> );

		expect( mountEffect ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should call the cleanup function when unmount', () => {
		const unmountCallback = jest.fn();

		function TestComponent() {
			useDidMount( () => unmountCallback );
			return null;
		}

		const { unmount } = render( <TestComponent /> );

		expect( unmountCallback ).not.toHaveBeenCalled();

		unmount();

		expect( unmountCallback ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should match the calling order of componentDidMount', async () => {
		const mountEffectCallback = jest.fn();
		const effectCallback = jest.fn();

		const didMountCallback = jest.fn(
			() =>
				new Promise( ( resolve ) => {
					expect( mountEffectCallback ).toHaveBeenCalled();
					expect( effectCallback ).not.toHaveBeenCalled();

					resolve();
				} )
		);

		let promise;

		class DidMount extends Component {
			componentDidMount() {
				promise = didMountCallback();
			}
			render() {
				return null;
			}
		}

		function Hook() {
			useDidMount( mountEffectCallback );
			useEffect( effectCallback );
			return null;
		}

		function TestComponent() {
			return (
				<>
					<Hook />
					<DidMount />
				</>
			);
		}

		render( <TestComponent /> );

		await promise;
	} );
} );
