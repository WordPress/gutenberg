/**
 * WordPress dependencies
 */

import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import MoveToWidgetArea from '../components/move-to-widget-area';
import { store as editWidgetsStore } from '../store';

const withMoveToWidgetAreaToolbarItem = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { __internalWidgetId } = props.attributes;
		const { widgetAreas, currentWidgetArea } = useSelect(
			( select ) => {
				const selectors = select( editWidgetsStore );
				return {
					widgetAreas: selectors.getWidgetAreas(),
					currentWidgetArea: __internalWidgetId
						? selectors.getWidgetAreaForWidgetId(
								__internalWidgetId
						  )
						: undefined,
				};
			},
			[ __internalWidgetId ]
		);

		const { moveBlockToWidgetArea } = useDispatch( editWidgetsStore );

		return (
			<>
				<BlockEdit { ...props } />
				{ props.name !== 'core/widget-area' && (
					<BlockControls>
						<MoveToWidgetArea
							widgetAreas={ widgetAreas }
							currentWidgetArea={ currentWidgetArea }
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
