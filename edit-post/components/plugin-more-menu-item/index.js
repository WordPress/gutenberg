/**
 * WordPress dependencies
 */
import { compose, MenuItemsGroup } from '@wordpress/element';
import { Slot, Fill, withContext } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';

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

function PluginMoreMenuItem( { title, onClick, icon, type, target } ) {
	return (
		<Fill name={ SLOT_NAME }>
			<MoreMenuItemLayout
				title={ title }
				onClick={ onClick }
				icon={ icon } />
		</Fill>
	);
}

PluginMoreMenuItem.Slot = ( { getFills } ) => {
	// We don't want the plugins menu items group to be rendered if there are no fills.
	if ( ! getFills( SLOT_NAME ).length ) {
		return null;
	}
	return (
		<div className="edit-post-plugin-more-menu-item__slot">
			<h2>Title</h2>
			<Slot name={ SLOT_NAME } />
		</div>
	);
};

PluginMoreMenuItem.Slot = compose( [
	withContext( 'getFills' )(),
] )( PluginMoreMenuItem.Slot );

export default PluginMoreMenuItem;
