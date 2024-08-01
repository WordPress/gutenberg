/**
 * External dependencies
 */

import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import ScrollLock from '..';

describe( 'scroll-lock', () => {
	const lockingClassName = 'lockscroll';

	it( 'locks when mounted', async () => {
		expect( document.documentElement ).not.toHaveClass( lockingClassName );
		await render( <ScrollLock /> );
		expect( document.documentElement ).toHaveClass( lockingClassName );
	} );

	it( 'unlocks when unmounted', async () => {
		const { unmount } = await render( <ScrollLock /> );
		expect( document.documentElement ).toHaveClass( lockingClassName );
		unmount();
		expect( document.documentElement ).not.toHaveClass( lockingClassName );
	} );
} );
