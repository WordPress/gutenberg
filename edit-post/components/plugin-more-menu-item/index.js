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
 * Name of slot in which the more menu items should fill.
 *
 * @type {string}
 */
const SLOT_NAME = 'PluginMoreMenuItem';

let PluginMoreMenuItem = ( { label, onClick, icon, isSelected } ) => (
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

PluginMoreMenuItem = compose( [
	withContext( 'pluginName' )( ( pluginName, { target } ) => {
		return {
			target: `${ pluginName }/${ target }`,
		};
	} ),
	withSelect( ( select, { type, target } ) => {
		let isSelected = false;
		switch ( type ) {
			case 'sidebar':
				isSelected = select( 'core/edit-post' ).getActiveGeneralSidebarName() === target;
				break;
		}
		return {
			isSelected,
		};
	} ),
	withDispatch( ( dispatch, { type, target, isSelected } ) => {
		let onClick = noop;
		const {
			closeGeneralSidebar,
			openGeneralSidebar,
		} = dispatch( 'core/edit-post' );
		switch ( type ) {
			case 'sidebar': {
				if ( isSelected ) {
					onClick = closeGeneralSidebar;
				} else {
					onClick = () => openGeneralSidebar( target );
				}
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
