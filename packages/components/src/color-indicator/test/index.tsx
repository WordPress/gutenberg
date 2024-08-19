/**
 * External dependencies
 */

import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import ColorIndicator from '..';

describe( 'ColorIndicator', () => {
	it( 'matches the snapshot', async () => {
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
		await render(
			<ColorIndicator aria-label="sample label" colorValue="#fff" />,
			{ container }
		);

		expect( container ).toMatchSnapshot();
	} );
} );
