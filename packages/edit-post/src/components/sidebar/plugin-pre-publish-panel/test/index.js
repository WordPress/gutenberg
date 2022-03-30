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
import PluginPrePublishPanel from '../';

describe( 'PluginPrePublishPanel', () => {
	test( 'renders fill properly', () => {
		const { container } = render(
			<SlotFillProvider>
				<PluginPrePublishPanel
					className="my-plugin-pre-publish-panel"
					title="My panel title"
					initialOpen={ true }
				>
					My panel content
				</PluginPrePublishPanel>
				<PluginPrePublishPanel.Slot />
			</SlotFillProvider>
		);

		expect( container.innerHTML ).toMatchSnapshot();
	} );
} );
