/**
 * External dependencies
 */
import { map, isEmpty } from 'lodash';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItemsGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getEllipsisMenuItems } from '../../../api/ellipsis-menu';

/**
 * Renders a list of plugins that will activate different UI elements.
 *
 * @returns {Object} The rendered list of menu items.
 */
function Plugins( props ) {
	const ellipsisMenuItems = getEllipsisMenuItems();

	if ( isEmpty( ellipsisMenuItems ) ) {
		return null;
	}

	/**
	 * Handles the user clicking on one of the plugins in the menu
	 *
	 * Does nothing currently, but should be used to trigger the plugins sidebar
	 *
	 * @param {string} pluginId The plugin id.
	 *
	 * @returns {void}
	 */
	function onSelect( pluginId ) {
		props.onSelect();
		ellipsisMenuItems[ pluginId ].callback();
	}

	const plugins = map( ellipsisMenuItems, ( menuItem ) => {
		return {
			value: menuItem.name,
			label: menuItem.title,
		};
	} );

	return [
		<div
			key="plugins-separator"
			className="editor-ellipsis-menu__separator" />,
		<MenuItemsGroup
			key="plugins-menu-items"
			label={ __( 'Plugins' ) }
			choices={ plugins }
			onSelect={ onSelect } />,
	];
}

export default connect(
	( state ) => {
		return state;
	}
)( Plugins );
