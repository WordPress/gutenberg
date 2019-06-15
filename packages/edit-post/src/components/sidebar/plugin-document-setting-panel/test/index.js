/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PluginDocumentSettingPanel from '../';

describe( 'PluginDocumentSetting', () => {
	test( 'renders fill properly', () => {
		const div = document.createElement( 'div' );
		render(
			<SlotFillProvider>
				<PluginDocumentSettingPanel
					className="my-plugin-settings-sidebar"
					title="My panel title"
					initialOpen={ true }
					icon="smiley"
				>
					My panel content
				</PluginDocumentSettingPanel>
				<PluginDocumentSettingPanel.Slot />
			</SlotFillProvider>,
			div
		);

		expect( div.innerHTML ).toMatchSnapshot();
	} );
} );
