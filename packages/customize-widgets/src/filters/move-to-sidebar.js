/**
 * WordPress dependencies
 */
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { MoveToWidgetArea, getWidgetIdFromBlock } from '@wordpress/widgets';

/**
 * Internal dependencies
 */
import {
	useSidebarControls,
	useActiveSidebarControl,
} from '../components/sidebar-controls';
import { useFocusControl } from '../components/focus-control';
import { blockToWidget } from '../utils';

const withMoveToSidebarToolbarItem = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		let widgetId = getWidgetIdFromBlock( props );
		const sidebarControls = useSidebarControls();
		const activeSidebarControl = useActiveSidebarControl();
		const hasMultipleSidebars = sidebarControls?.length > 1;
		const blockName = props.name;
		const clientId = props.clientId;
		const canInsertBlockInSidebar = useSelect(
			( select ) => {
				// Use an empty string to represent the root block list, which
				// in the customizer editor represents a sidebar/widget area.
				return select( blockEditorStore ).canInsertBlockType(
					blockName,
					''
				);
			},
			[ blockName ]
		);
		const block = useSelect(
			( select ) => select( blockEditorStore ).getBlock( clientId ),
			[ clientId ]
		);
		const { removeBlock } = useDispatch( blockEditorStore );
		const [ , focusWidget ] = useFocusControl();

		function moveToSidebar( sidebarControlId ) {
			const newSidebarControl = sidebarControls.find(
				( sidebarControl ) => sidebarControl.id === sidebarControlId
			);

			if ( widgetId ) {
				/**
				 * If there's a widgetId, move it to the other sidebar.
				 */
				const oldSetting = activeSidebarControl.setting;
				const newSetting = newSidebarControl.setting;

				oldSetting( oldSetting().filter( ( id ) => id !== widgetId ) );
				newSetting( [ ...newSetting(), widgetId ] );
			} else {
				/**
				 * If there isn't a widgetId, it's most likely a inner block.
				 * First, remove the block in the original sidebar,
				 * then, create a new widget in the new sidebar and get back its widgetId.
				 */
				const sidebarAdapter = newSidebarControl.sidebarAdapter;

				removeBlock( clientId );
				const addedWidgetIds = sidebarAdapter.setWidgets( [
					...sidebarAdapter.getWidgets(),
					blockToWidget( block ),
				] );
				// The last non-null id is the added widget's id.
				widgetId = addedWidgetIds.reverse().find( ( id ) => !! id );
			}

			// Move focus to the moved widget and expand the sidebar.
			focusWidget( widgetId );
		}

		return (
			<>
				<BlockEdit { ...props } />
				{ hasMultipleSidebars && canInsertBlockInSidebar && (
					<BlockControls>
						<MoveToWidgetArea
							widgetAreas={ sidebarControls.map(
								( sidebarControl ) => ( {
									id: sidebarControl.id,
									name: sidebarControl.params.label,
									description:
										sidebarControl.params.description,
								} )
							) }
							currentWidgetAreaId={ activeSidebarControl?.id }
							onSelect={ moveToSidebar }
						/>
					</BlockControls>
				) }
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
