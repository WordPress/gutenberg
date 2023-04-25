/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

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
		render(
			<SlotFillProvider>
				<PluginPrePublishPanel
					className="my-plugin-pre-publish-panel"
					title="My panel title"
					initialOpen
				>
					My panel content
				</PluginPrePublishPanel>
				<PluginPrePublishPanel.Slot />
			</SlotFillProvider>
		);

		expect( screen.getByText( 'My panel title' ) ).toBeVisible();
	} );
} );
