/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import ScrollLock from '..';

describe( 'scroll-lock', () => {
	const lockingClassName = 'lockscroll';

	// Use a separate document to reduce the risk of test side-effects.
	let wrapper = null;

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
		if ( wrapper && wrapper.length ) {
			wrapper.unmount();
			wrapper = null;
		}
	} );

	it( 'locks when mounted', () => {
		expectLocked( false );
		wrapper = mount( <ScrollLock /> );
		expectLocked( true );
	} );

	it( 'unlocks when unmounted', () => {
		wrapper = mount( <ScrollLock /> );
		expectLocked( true );
		wrapper.unmount();

		// Running cleanup functions now works asynchronously. the unofficial
		// enzyme adapter for react 17 we're currently using does not account
		// for this, yet. So for now, we'll use jest.advanceTimersByTime to wait for cleanup.
		//
		// @see https://reactjs.org/blog/2020/08/10/react-v17-rc.html#effect-cleanup-timing
		jest.advanceTimersByTime( 1 );
		expectLocked( false );
	} );
} );
