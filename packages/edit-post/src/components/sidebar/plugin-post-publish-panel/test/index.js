/**
 * External dependencies
 */
import { act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PluginPostPublishPanel from '../';

describe( 'PluginPostPublishPanel', () => {
	test( 'renders fill properly', () => {
		const div = document.createElement( 'div' );
		const root = createRoot( div );
		act( () => {
			root.render(
				<SlotFillProvider>
					<PluginPostPublishPanel
						className="my-plugin-post-publish-panel"
						title="My panel title"
						initialOpen={ true }
					>
						My panel content
					</PluginPostPublishPanel>
					<PluginPostPublishPanel.Slot />
				</SlotFillProvider>
			);
		} );
		expect( div.innerHTML ).toMatchSnapshot();
	} );
} );
