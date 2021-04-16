/**
 * External dependencies
 */
import { without } from 'lodash';

/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

const { wp } = window;

/**
 * Internal dependencies
 */
import MoveToSidebar from '../components/move-to-sidebar';

/**
 * Use the customize API to get the setting for the sidebar.
 * This returns a function that acts as a setter/getter in one for widget ids
 * in sidebars.
 *
 * @param {string} id The id of the sidebar
 *
 * @return {Function} A function that when called with no arguments, returns
 *                    an array of widgetIds for the sidebar. When called with
 *                    an array, sets that array as the widget ids for the
 *                    sidebar.
 */
function getSidebarWidgetSetting( id ) {
	return wp.customize( `sidebars_widgets[${ id }]` );
}

/**
 * Returns the sidebar object that the widget represented by the provided
 * widgetId belongs to.
 *
 * @param {string} widgetId A widget id
 *
 * @return {Object} Configuration of the sidebar that the widget is in.
 */
function getSidebarForWidgetId( widgetId ) {
	return wp.customize.Widgets.data.registeredSidebars.find( ( { id } ) => {
		const sidebarWidgetsSetting = getSidebarWidgetSetting( id );
		const sidebarWidgetIds = sidebarWidgetsSetting();
		return sidebarWidgetIds.includes( widgetId );
	} );
}

/**
 * Returns a list of the registered sidebars.
 *
 * @return {Object[]} An array of sidebar configurations objects.
 */
function getSidebars() {
	return wp.customize.Widgets.data.registeredSidebars;
}

/**
 * Moves a widget from one sidebar to another.
 *
 * @param {string} widgetId     The id of the widget to move.
 * @param {string} oldSidebarId The id of the sidebar to move from.
 * @param {string} newSidebarId The id of the sidebar to move to.
 */
function moveToSidebar( widgetId, oldSidebarId, newSidebarId ) {
	const oldSidebarWidgetsSetting = getSidebarWidgetSetting( oldSidebarId );
	const newSidebarWidgetsSetting = getSidebarWidgetSetting( newSidebarId );

	// Update the widgets in the old and new sidebars.
	oldSidebarWidgetsSetting( without( oldSidebarWidgetsSetting(), widgetId ) );
	newSidebarWidgetsSetting( [ ...newSidebarWidgetsSetting(), widgetId ] );
}

const withMoveToSidebarToolbarItem = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { __internalWidgetId: widgetId } = props.attributes;
		const currentSidebar = getSidebarForWidgetId( widgetId );

		return (
			<>
				<BlockEdit { ...props } />
				<BlockControls>
					<MoveToSidebar
						sidebars={ getSidebars() }
						currentSidebar={ currentSidebar }
						onSelect={ ( newSidebarId ) => {
							moveToSidebar(
								widgetId,
								currentSidebar.id,
								newSidebarId
							);
						} }
					/>
				</BlockControls>
			</>
		);
	},
	'withMoveToSidebarToolbarItem'
);

addFilter(
	'editor.BlockEdit',
	'core/customize-widgets/block-edit',
	withMoveToSidebarToolbarItem
);
