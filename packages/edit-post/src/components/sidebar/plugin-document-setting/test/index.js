/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PluginDocumentSetting from '../';

jest.mock( '../../../../../../components/src/button' );

describe( 'PluginDocumentSetting', () => {
	test( 'renders fill properly', () => {
		const div = document.createElement( 'div' );
		render(
			<SlotFillProvider>
				<PluginDocumentSetting
					className="my-plugin-settings-sidebar"
					title="My panel title"
					initialOpen={ true }>
					My panel content
				</PluginDocumentSetting>
				<PluginDocumentSetting.Slot />
			</SlotFillProvider>,
			div
		);

		expect( div.innerHTML ).toMatchSnapshot();
	} );
} );
