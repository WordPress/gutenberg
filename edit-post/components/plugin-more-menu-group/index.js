/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { withContext, MenuGroup } from '@wordpress/components';
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
		<MenuGroup
			label={ __( 'Plugins' ) } >
			<PluginMoreMenuItem.Slot name={ SLOT_NAME } fillProps={ fillProps } />
		</MenuGroup>
	);
};

export default compose( [
	withContext( 'getFills' )(),
] )( PluginMoreMenuGroup );
