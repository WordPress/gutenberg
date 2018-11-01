/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PluginPostPublishPanel from '../';

jest.mock( '../../../../../../components/src/button' );

describe( 'PluginPostPublishPanel', () => {
	test( 'renders fill properly', () => {
		const div = document.createElement( 'div' );
		render(
			<SlotFillProvider>
				<PluginPostPublishPanel
					className="my-plugin-post-publish-panel"
					title="My panel title"
					initialOpen={ true }
				>
				My panel content
				</PluginPostPublishPanel>
				<PluginPostPublishPanel.Slot />
			</SlotFillProvider>,
			div
		);

		expect( div.innerHTML ).toMatchSnapshot();
	} );
} );
