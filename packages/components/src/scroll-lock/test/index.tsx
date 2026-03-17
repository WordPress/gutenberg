/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ScrollLock from '..';

describe( 'scroll-lock', () => {
	const lockingClassName = 'lockscroll';

	it( 'locks when mounted', () => {
		expect( document.documentElement ).not.toHaveClass( lockingClassName );
		render( <ScrollLock /> );
		expect( document.documentElement ).toHaveClass( lockingClassName );
	} );

	it( 'unlocks when unmounted', () => {
		const { unmount } = render( <ScrollLock /> );
		expect( document.documentElement ).toHaveClass( lockingClassName );
		unmount();
		expect( document.documentElement ).not.toHaveClass( lockingClassName );
	} );
} );
