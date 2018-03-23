/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { Slot, Fill, withContext, MenuItemsGroup, MenuItemsItem } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Name of slot in which the sidebar should fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'PluginMoreMenuItem';

function PluginMoreMenuItem( { label, onClick, icon, isSelected } ) {
	return (
		<Fill name={ SLOT_NAME }>
			{ ( props ) => {
				return (
					<MenuItemsItem
						icon={ isSelected ? 'yes' : icon }
						isSelected={ isSelected }
						label={ label }
						onClick={ () => {
							onClick();
							props.onClose();
						} }
					/>
				);
			} }
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
		isSelected: select( 'core/edit-post' ).getActiveGeneralSidebarName() === target,
	} ) ),
	withDispatch( ( dispatch, { type, target, isSelected } ) => {
		let onClick = noop;
		if ( isSelected ) {
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

PluginMoreMenuItem.Slot = ( { getFills, fillProps } ) => {
	// We don't want the plugins menu items group to be rendered if there are no fills.
	if ( ! getFills( SLOT_NAME ).length ) {
		return null;
	}
	return (
		<MenuItemsGroup
			label={ __( 'Plugins' ) } >
			<Slot name={ SLOT_NAME } fillProps={ fillProps } />
		</MenuItemsGroup>
	);
};

PluginMoreMenuItem.Slot = compose( [
	withContext( 'getFills' )(),
] )( PluginMoreMenuItem.Slot );

export default PluginMoreMenuItem;
