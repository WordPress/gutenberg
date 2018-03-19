/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { Slot, Fill, withContext, MenuItemsGroup } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import MoreMenuItemLayout from './more-menu-item-layout';

/**
 * Name of slot in which the sidebar should fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'PluginMoreMenuItem';

function PluginMoreMenuItem( { title, onClick, icon, isActive } ) {
	return (
		<Fill name={ SLOT_NAME }>
			<MoreMenuItemLayout
				isActive={ isActive }
				title={ title }
				onClick={ onClick }
				icon={ icon } />
		</Fill>
	);
}

PluginMoreMenuItem = compose( [
	withContext( 'pluginName' )( ( pluginName, { target } ) => {
		return {
			target: `${ pluginName }/${ target }`,
		};
	} ),
	withSelect( ( select, { target } ) => ( {
		isActive: select( 'core/edit-post' ).getActiveGeneralSidebarName() === target,
	} ) ),
	withDispatch( ( dispatch, { type, target, isActive } ) => {
		let onClick = noop;
		if ( isActive ) {
			onClick = dispatch( 'core/edit-post' ).closeGeneralSidebar;
		} else {
			switch ( type ) {
				case 'sidebar':
					onClick = () => dispatch( 'core/edit-post' ).openGeneralSidebar( target );
			}
		}
		return {
			onClick,
		};
	} ),
] )( PluginMoreMenuItem );

PluginMoreMenuItem.Slot = ( { getFills } ) => {
	// We don't want the plugins menu items group to be rendered if there are no fills.
	if ( ! getFills( SLOT_NAME ).length ) {
		return null;
	}
	return (
		<MenuItemsGroup
			label={ __( 'Plugins' ) } >
			<Slot name={ SLOT_NAME } />
		</MenuItemsGroup>
	);
};

PluginMoreMenuItem.Slot = compose( [
	withContext( 'getFills' )(),
] )( PluginMoreMenuItem.Slot );

export default PluginMoreMenuItem;
