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

function getSidebarForWidgetId( widgetId ) {
	const api = wp.customize;
	return api.Widgets.data.registeredSidebars.find( ( { id } ) => {
		const sidebarWidgetsSetting = api( `sidebars_widgets[${ id }]` );
		const sidebarWidgetIds = sidebarWidgetsSetting();
		return sidebarWidgetIds.includes( widgetId );
	} );
}

function getSidebars() {
	return wp.customize.Widgets.data.registeredSidebars;
}

function moveToSidebar( widgetId, oldSidebarId, newSidebarId ) {
	const api = wp.customize;

	// These calls create a combined setter/getter function for widgets in
	// sidebars
	const oldSidebarWidgetsSetting = api(
		`sidebars_widgets[${ oldSidebarId }]`
	);
	const newSidebarWidgetsSetting = api(
		`sidebars_widgets[${ newSidebarId }]`
	);

	// Update the widgets int he old and new sidebars
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
