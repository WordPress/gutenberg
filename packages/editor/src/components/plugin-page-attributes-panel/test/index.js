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
import PluginPageAttributesPanel from '../';

describe( 'PluginPageAttributesPanel', () => {
	test( 'renders fill properly', () => {
		render(
			<SlotFillProvider>
				<PluginPageAttributesPanel className="my-plugin-page-attributes-panel">
					My page attributes panel content
				</PluginPageAttributesPanel>
				<PluginPageAttributesPanel.Slot />
			</SlotFillProvider>
		);

		expect(
			screen.getByText( 'My page attributes panel content' )
		).toBeVisible();
	} );
} );
