/**
 * WordPress dependencies
 */

import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import MoveToWidgetArea from '../components/move-to-widget-area';

const withMoveToWidgetAreaToolbarItem = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { __internalWidgetId } = props;
		const { widgetAreas, currentWidgetArea } = useSelect(
			( select ) => {
				const selectors = select( 'core/edit-widgets' );
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

		return (
			<>
				{ props.name !== 'core/widget-area' && (
					<BlockControls>
						<MoveToWidgetArea
							widgetAreas={ widgetAreas }
							currentWidgetArea={ currentWidgetArea }
							onSelect={ () => {} }
						/>
					</BlockControls>
				) }
				<BlockEdit { ...props } />
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
