/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { withContext, MenuItemsGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PluginMoreMenuItem, { SLOT_NAME } from '../plugin-more-menu-item';

const PluginMoreMenuGroup = ( { getFills, fillProps } ) => {
	// We don't want the plugins menu items group to be rendered if there are no fills.
	if ( ! getFills( SLOT_NAME ).length ) {
		return null;
	}
	return (
		<MenuItemsGroup
			label={ __( 'Plugins' ) } >
			<PluginMoreMenuItem.Slot name={ SLOT_NAME } fillProps={ fillProps } />
		</MenuItemsGroup>
	);
};

export default compose( [
	withContext( 'getFills' )(),
] )( PluginMoreMenuGroup );
