/**
 * External dependencies
 */
import { invert } from 'lodash';

/**
 * Internal dependencies
 */
import { dispatch, select, getWidgetToClientIdMapping } from './controls';
import { transformBlockToWidget } from './transformers';
import { KIND, WIDGET_AREA_ENTITY_TYPE } from './utils';

export function* saveEditedWidgetAreas() {
	const editedWidgetAreas = yield select(
		'core/edit-widgets',
		'getEditedWidgetAreas'
	);
	if ( ! editedWidgetAreas?.length ) {
		return;
	}

	const widgets = yield select( 'core/edit-widgets', 'getWidgets' );
	const widgetIdToClientId = yield getWidgetToClientIdMapping();
	const clientIdToWidgetId = invert( widgetIdToClientId );

	// @TODO: Batch save and concurrency
	for ( const widgetArea of editedWidgetAreas ) {
		const widgetAreaBlock = widgetArea.blocks[ 0 ];
		const widgetsBlocks = widgetAreaBlock.innerBlocks;
		const newWidgets = widgetsBlocks.map( ( block ) => {
			const widgetId = clientIdToWidgetId[ block.clientId ];
			const oldWidget = widgets[ widgetId ];
			return transformBlockToWidget( block, oldWidget );
		} );

		yield* saveWidgetArea( widgetArea, newWidgets );
	}
}

export function* saveWidgetArea( widgetArea, newWidgets ) {
	yield dispatch(
		'core',
		'editEntityRecord',
		KIND,
		WIDGET_AREA_ENTITY_TYPE,
		widgetArea.id,
		{ widgets: newWidgets }
	);

	yield dispatch(
		'core',
		'saveEditedEntityRecord',
		KIND,
		WIDGET_AREA_ENTITY_TYPE,
		widgetArea.id
	);
}
