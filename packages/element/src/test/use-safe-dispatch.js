/**
 * External dependencies
 */
import { render, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	__experimentalUseSafeDispatch as useSafeDispatch,
} from '@wordpress/element';

function deferred() {
	let resolve, reject;
	const promise = new Promise( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	return { promise, resolve, reject };
}

describe( '__experimentalUseSafeDispatch', () => {
	it( 'does not allow dispatch on unmounted component', async () => {
		jest.spyOn( console, 'error' );

		const { promise, resolve } = deferred();

		jest.useFakeTimers();

		function MyComponent() {
			const [ msg, setMsg ] = useState();

			const safeSetMsg = useSafeDispatch( setMsg );

			useEffect( () => {
				async function doAsync() {
					await promise;
					safeSetMsg( 'Loaded' );
				}

				doAsync();
			}, [ safeSetMsg ] );
			return <p>Hello from Component: { msg }</p>;
		}

		const { unmount } = render( <MyComponent /> );

		// Unmount whilst still 'await'ing in component.
		unmount();

		// Resolve the Promise within the component's effect
		// that was not cleaned up.
		await act( async () => {
			resolve();
		} );

		// Look for warning:
		// "Warning: Can't perform a React state update on an unmounted component"
		// eslint-disable-next-line no-console
		const badCall = console.error.mock.calls.find( ( args ) =>
			args.some( ( a ) => a && a.includes && a.includes( 'unmounted' ) )
		);
		expect( badCall ).toBe( undefined );
		// eslint-disable-next-line no-console
		console.error.mockRestore();
	} );
} );
