/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PluginSettingsSidebar from '../';

jest.mock( '../../../../../../components/src/button' );

describe( 'PluginSettingsSidebar', () => {
	test( 'renders fill properly', () => {
		const div = document.createElement( 'div' );
		render(
			<SlotFillProvider>
				<PluginSettingsSidebar>
					My panel content
				</PluginSettingsSidebar>
				<PluginSettingsSidebar.Slot />
			</SlotFillProvider>,
			div
		);

		expect( div.innerHTML ).toMatchSnapshot();
	} );
} );
