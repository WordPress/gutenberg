/**
 * External dependencies
 */
import { map } from 'lodash';
import { connect } from 'react-redux';
import { isEmpty } from 'lodash';

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
function Plugins() {
	const ellipsisMenuItems = getEllipsisMenuItems();

	/**
	 * Handles the user clicking on one of the plugins in the menu
	 *
	 * Does nothing currently, but should be used to trigger the plugins sidebar
	 */
	function onSelect(value) {
		console.log('selected ellepsis menu plugin: ', value);
	}

	const plugins = map( ellipsisMenuItems, ( menuItem ) => {
		return {
			value: menuItem.name,
			label: menuItem.title,
		};
	} );

	if(isEmpty(ellipsisMenuItems)) {
		return null;
	}

	return (
		<MenuItemsGroup
			label={ __( 'Plugins' ) }
			choices={ plugins }
			onSelect={ onSelect }
		/>
	);
}

export default connect(
	( state ) => {
		return state;
	}
)( Plugins );
