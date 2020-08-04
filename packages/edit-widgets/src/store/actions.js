/**
 * External dependencies
 */
import { invert } from 'lodash';

/**
 * Internal dependencies
 */
import { select, getWidgetToClientIdMapping } from './controls';
import { transformBlockToWidget } from './transformers';

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
	console.log(
		widgets,
		widgetIdToClientId,
		clientIdToWidgetId
	)

	// @TODO: Batch save and concurrency
	for ( const widgetArea of editedWidgetAreas ) {
		const areaWidgets = widgetArea.blocks.map( ( block ) => {
			const widgetId = clientIdToWidgetId[ block.clientId ];
			const oldWidget = widgets[ widgetId ];
			const newWidget = transformBlockToWidget( block, oldWidget );
			console.log( block.clientId, oldWidget, newWidget );
		} );

		// yield* saveWidgetArea( widgetArea );
	}
}

export function* saveWidgetArea( widgetArea ) {
	const widgets = widgetArea.blocks.map( transformBlockToWidget );
	console.log( 'saving widget area', widgetArea.blocks, widgets );
	// return;
	// Update the entity with widgets list
	// Save the entity by sending an API request
}
