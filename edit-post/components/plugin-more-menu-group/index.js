/**
 * WordPress dependencies
 */
import { SlotFillContext, MenuGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PluginMoreMenuItem, { SLOT_NAME } from '../plugin-more-menu-item';

function PluginMoreMenuGroup( { fillProps } ) {
	return (
		<SlotFillContext.Consumer>
			{ ( { getFills } ) => {
				// We don't want the plugins menu items group to be rendered if there are no fills.
				if ( ! getFills( SLOT_NAME ).length ) {
					return null;
				}

				return (
					<MenuGroup
						label={ __( 'Plugins' ) } >
						<PluginMoreMenuItem.Slot name={ SLOT_NAME } fillProps={ fillProps } />
					</MenuGroup>
				);
			} }
		</SlotFillContext.Consumer>
	);
}

export default PluginMoreMenuGroup;
