/**
 * External dependencies
 */
import { noop } from 'lodash';
import ReactTestRenderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { more } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PluginMoreMenuItem from '../';
import PluginsMoreMenuGroup from '../../plugins-more-menu-group';

describe( 'PluginMoreMenuItem', () => {
	const fillProps = {
		onClose: noop,
	};

	test( 'renders menu item as button properly', () => {
		const component = ReactTestRenderer.create(
			<SlotFillProvider>
				<PluginMoreMenuItem icon={ more }>
					My plugin button menu item
				</PluginMoreMenuItem>
				<PluginsMoreMenuGroup.Slot fillProps={ fillProps } />
			</SlotFillProvider>
		);

		expect( component.toJSON() ).toMatchSnapshot();
	} );

	test( 'renders menu item as link properly', () => {
		const url = 'https://make.wordpress.org';
		const component = ReactTestRenderer.create(
			<SlotFillProvider>
				<PluginMoreMenuItem icon={ more } href={ url }>
					My plugin link menu item
				</PluginMoreMenuItem>
				<PluginsMoreMenuGroup.Slot fillProps={ fillProps } />
			</SlotFillProvider>
		);

		expect( component.root.findByType( 'a' ).props.href ).toBe( url );
	} );
} );
