/**
 * WordPress dependencies
 */

import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { getWidgetIdFromBlock, MoveToWidgetArea } from '@wordpress/widgets';

/**
 * Internal dependencies
 */
import { store as editWidgetsStore } from '../store';

const withMoveToWidgetAreaToolbarItem = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const widgetId = getWidgetIdFromBlock( props );
		const { widgetAreas, currentWidgetAreaId } = useSelect(
			( select ) => {
				const selectors = select( editWidgetsStore );
				return {
					widgetAreas: selectors.getWidgetAreas(),
					currentWidgetArea: widgetId
						? selectors.getWidgetAreaForWidgetId( widgetId )?.id
						: undefined,
				};
			},
			[ widgetId ]
		);

		const { moveBlockToWidgetArea } = useDispatch( editWidgetsStore );

		return (
			<>
				<BlockEdit { ...props } />
				{ props.name !== 'core/widget-area' && (
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
