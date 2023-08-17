/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PluginPostStatusInfo from '../';

describe( 'PluginPostStatusInfo', () => {
	test( 'renders fill properly', () => {
		const { container } = render(
			<SlotFillProvider>
				<PluginPostStatusInfo className="my-plugin-post-status-info">
					My plugin post status info
				</PluginPostStatusInfo>
				<PluginPostStatusInfo.Slot />
			</SlotFillProvider>
		);

		expect( container ).toMatchSnapshot();
	} );
} );
