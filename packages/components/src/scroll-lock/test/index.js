/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ScrollLock from '..';

describe( 'scroll-lock', () => {
	const lockingClassName = 'lockscroll';

	// Use a separate document to reduce the risk of test side-effects.
	let root = null;

	function expectLocked( locked ) {
		expect(
			document.documentElement.classList.contains( lockingClassName )
		).toBe( locked );
		// Assert against `body` because `scrollingElement` does not exist on our test DOM implementation.
		expect( document.body.classList.contains( lockingClassName ) ).toBe(
			locked
		);
	}

	afterEach( () => {
		if ( root ) {
			root.unmount();
		}
	} );

	it( 'locks when mounted', () => {
		expectLocked( false );
		const container = document.createElement( 'div' );
		root = createRoot( container );
		root.render( <ScrollLock /> );
		jest.runAllTimers();
		expectLocked( true );
	} );

	it( 'unlocks when unmounted', () => {
		const container = document.createElement( 'div' );
		root = createRoot( container );
		root.render( <ScrollLock /> );
		jest.runAllTimers();
		expectLocked( true );
		root.unmount();
		jest.runAllTimers();

		// Running cleanup functions now works asynchronously. the unofficial
		// enzyme adapter for react 17 we're currently using does not account
		// for this, yet. So for now, we'll use jest.advanceTimersByTime to wait for cleanup.
		//
		// @see https://reactjs.org/blog/2020/08/10/react-v17-rc.html#effect-cleanup-timing
		jest.advanceTimersByTime( 1 );
		expectLocked( false );
	} );
} );
