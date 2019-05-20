/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';

export function setupWidgetAreas( widgetAreas ) {
	return {
		type: 'SETUP_WIDGET_AREAS',
		widgetAreas: map( widgetAreas, ( area ) => {
			return {
				...area,
				blocks: parse( ( area.content && area.content.raw ) || '' ),
			};
		} ),
	};
}

export function updateBlocksInWidgetArea( widgetAreaId, blocks ) {
	return {
		type: 'UPDATE_BLOCKS_IN_WIDGET_AREA',
		widgetAreaId,
		blocks,
	};
}
