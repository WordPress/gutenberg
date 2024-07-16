/**
 * WordPress dependencies
 */

import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { MoveToWidgetArea } from '@wordpress/widgets';

/**
 * Internal dependencies
 */
import { store as editWidgetsStore } from '../store';

const withMoveToWidgetAreaToolbarItem = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { clientId, name: blockName } = props;
		const { widgetAreas, currentWidgetAreaId, canInsertBlockInWidgetArea } =
			useSelect(
				( select ) => {
					// Component won't display for a widget area, so don't run selectors.
					if ( blockName === 'core/widget-area' ) {
						return {};
					}

					const selectors = select( editWidgetsStore );

					const widgetAreaBlock =
						selectors.getParentWidgetAreaBlock( clientId );

					return {
						widgetAreas: selectors.getWidgetAreas(),
						currentWidgetAreaId: widgetAreaBlock?.attributes?.id,
						canInsertBlockInWidgetArea:
							selectors.canInsertBlockInWidgetArea( blockName ),
					};
				},
				[ clientId, blockName ]
			);

		const { moveBlockToWidgetArea } = useDispatch( editWidgetsStore );
		const hasMultipleWidgetAreas = widgetAreas?.length > 1;
		const isMoveToWidgetAreaVisible =
			blockName !== 'core/widget-area' &&
			hasMultipleWidgetAreas &&
			canInsertBlockInWidgetArea;

		return (
			<>
				<BlockEdit key="edit" { ...props } />
				{ isMoveToWidgetAreaVisible && (
					<BlockControls>
						<MoveToWidgetArea
							widgetAreas={ widgetAreas }
							currentWidgetAreaId={ currentWidgetAreaId }
							onSelect={ ( widgetAreaId ) => {
								moveBlockToWidgetArea(
									props.clientId,
									widgetAreaId
								);
							} }
						/>
					</BlockControls>
				) }
			</>
		);
	},
	'withMoveToWidgetAreaToolbarItem'
);

addFilter(
	'editor.BlockEdit',
	'core/edit-widgets/block-edit',
	withMoveToWidgetAreaToolbarItem
);
