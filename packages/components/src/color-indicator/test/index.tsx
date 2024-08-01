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
		const { container } = await render(
			<ColorIndicator aria-label="sample label" colorValue="#fff" />
		);

		expect( container ).toMatchSnapshot();
	} );
} );
