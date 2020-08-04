/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { resolveWidgetAreas, select, dispatch } from './controls';
import { KIND, WIDGET_AREA_ENTITY_TYPE, buildWidgetAreasQuery } from './utils';
import { transformWidgetToBlock } from './transformers';

export function* getWidgetAreas() {
	const query = buildWidgetAreasQuery();
	yield resolveWidgetAreas( query );
	const widgetAreas = yield select(
		'core',
		'getEntityRecords',
		KIND,
		WIDGET_AREA_ENTITY_TYPE,
		query
	);

	const widgetIdToClientId = {};
	for ( const widgetArea of widgetAreas ) {
		const blocks = [];
		for ( const widget of widgetArea.widgets ) {
			const block = transformWidgetToBlock( widget );
			widgetIdToClientId[ widget.id ] = block.clientId;
			blocks.push( block );
		}
		widgetArea.blocks = [
			createBlock(
				'core/widget-area',
				{
					id: widgetArea.id,
					name: widgetArea.name,
				},
				blocks
			),
		];
	}

	yield {
		type: 'SET_WIDGET_TO_CLIENT_ID_MAPPING',
		mapping: widgetIdToClientId,
	};

	yield dispatch(
		'core',
		'receiveEntityRecords',
		KIND,
		WIDGET_AREA_ENTITY_TYPE,
		widgetAreas,
		query
	);
}
