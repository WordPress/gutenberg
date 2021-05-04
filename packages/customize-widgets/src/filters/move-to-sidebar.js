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
import { MoveToWidgetArea, getWidgetIdFromBlock } from '@wordpress/widgets';

/**
 * Internal dependencies
 */
import {
	useSidebarControls,
	useActiveSidebarControl,
} from '../components/sidebar-controls';

const withMoveToSidebarToolbarItem = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const widgetId = getWidgetIdFromBlock( props );
		const sidebarControls = useSidebarControls();
		const activeSidebarControl = useActiveSidebarControl();

		function moveToSidebar( sidebarControlId ) {
			const newSidebarControl = sidebarControls.find(
				( sidebarControl ) => sidebarControl.id === sidebarControlId
			);

			const oldSetting = activeSidebarControl.setting;
			const newSetting = newSidebarControl.setting;

			oldSetting( without( oldSetting(), widgetId ) );
			newSetting( [ ...newSetting(), widgetId ] );

			newSidebarControl.expand();
		}

		return (
			<>
				<BlockEdit { ...props } />
				<BlockControls>
					<MoveToWidgetArea
						widgetAreas={ sidebarControls.map(
							( sidebarControl ) => ( {
								id: sidebarControl.id,
								name: sidebarControl.params.label,
								description: sidebarControl.params.description,
							} )
						) }
						currentWidgetAreaId={ activeSidebarControl?.id }
						onSelect={ moveToSidebar }
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
