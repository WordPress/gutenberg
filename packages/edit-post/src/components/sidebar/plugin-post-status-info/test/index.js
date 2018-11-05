/**
 * External dependencies
 */
import ReactTestRenderer from 'react-test-renderer';

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
		const tree = ReactTestRenderer.create(
			<SlotFillProvider>
				<PluginPostStatusInfo
					className="my-plugin-post-status-info"
				>
					My plugin post status info
				</PluginPostStatusInfo>
				<PluginPostStatusInfo.Slot />
			</SlotFillProvider>
		).toJSON();

		expect( tree ).toMatchSnapshot();
	} );
} );
