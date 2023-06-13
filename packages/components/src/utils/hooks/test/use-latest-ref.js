/**
 * External dependencies
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useLatestRef } from '..';

function debounce( callback, timeout = 0 ) {
	let timeoutId = 0;
	return ( ...args ) => {
		window.clearTimeout( timeoutId );
		timeoutId = window.setTimeout( () => callback( ...args ), timeout );
	};
}

function useDebounce( callback, timeout = 0 ) {
	const callbackRef = useLatestRef( callback );
	return debounce( ( ...args ) => callbackRef.current( ...args ), timeout );
}

function Example() {
	const [ count, setCount ] = useState( 0 );
	const increment = () => setCount( count + 1 );
	const incrementDebounced = debounce( increment, 50 );
	const incrementDebouncedWithLatestRef = useDebounce( increment, 50 );

	return (
		<>
			<div>Count: { count }</div>
			<button onClick={ incrementDebounced }>Increment debounced</button>
			<button onClick={ increment }>Increment immediately</button>
			<br />
			<button onClick={ incrementDebouncedWithLatestRef }>
				Increment debounced with latest ref
			</button>
		</>
	);
}

function getCount() {
	return screen.getByText( /Count:/ ).innerHTML;
}

function incrementCount() {
	fireEvent.click( screen.getByText( 'Increment immediately' ) );
}

function incrementCountDebounced() {
	fireEvent.click( screen.getByText( 'Increment debounced' ) );
}

function incrementCountDebouncedRef() {
	fireEvent.click(
		screen.getByText( 'Increment debounced with latest ref' )
	);
}

describe( 'useLatestRef', () => {
	describe( 'Example', () => {
		// Prove the example works as expected.
		it( 'should start at 0', () => {
			render( <Example /> );

			expect( getCount() ).toEqual( 'Count: 0' );
		} );

		it( 'should increment immediately', () => {
			render( <Example /> );

			incrementCount();

			expect( getCount() ).toEqual( 'Count: 1' );
		} );

		it( 'should increment after debouncing', async () => {
			render( <Example /> );

			incrementCountDebounced();

			expect( getCount() ).toEqual( 'Count: 0' );
			await waitFor( () => expect( getCount() ).toEqual( 'Count: 1' ) );
		} );

		it( 'should increment after debouncing with latest ref', async () => {
			render( <Example /> );

			incrementCountDebouncedRef();

			expect( getCount() ).toEqual( 'Count: 0' );
			await waitFor( () => expect( getCount() ).toEqual( 'Count: 1' ) );
		} );
	} );

	it( 'should increment to one', async () => {
		render( <Example /> );

		incrementCountDebounced();
		incrementCount();

		await waitFor( () => expect( getCount() ).toEqual( 'Count: 1' ) );
	} );

	it( 'should increment to two', async () => {
		render( <Example /> );

		incrementCountDebouncedRef();
		incrementCount();

		await waitFor( () => expect( getCount() ).toEqual( 'Count: 2' ) );
	} );
} );
