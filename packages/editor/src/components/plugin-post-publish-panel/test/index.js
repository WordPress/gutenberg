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
import PluginPostPublishPanel from '../';

describe( 'PluginPostPublishPanel', () => {
	test( 'renders fill properly', () => {
		const { container } = render(
			<SlotFillProvider>
				<PluginPostPublishPanel
					className="my-plugin-post-publish-panel"
					title="My panel title"
					initialOpen
				>
					My panel content
				</PluginPostPublishPanel>
				<PluginPostPublishPanel.Slot />
			</SlotFillProvider>
		);

		expect( container ).toMatchSnapshot();
	} );
} );
