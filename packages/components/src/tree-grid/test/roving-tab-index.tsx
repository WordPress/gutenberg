/**
 * External dependencies
 */

import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import RovingTabIndex from '../roving-tab-index';

describe( 'RovingTabIndex', () => {
	it( 'does not render any elements other than its children', async () => {
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
		await render(
			<RovingTabIndex>
				<div>child element</div>
			</RovingTabIndex>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
	} );
} );
