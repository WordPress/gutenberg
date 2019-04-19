/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	parse,
	serialize,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { STORE_KEY } from './constants';
import {
	select,
	apiFetch,
} from './controls';

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

export function* saveWidgetAreas() {
	const widgetAreas = yield select(
		STORE_KEY,
		'getWidgetAreas'
	);
	for ( const widgetArea of widgetAreas ) {
		const widgetAreaBlocks = yield select(
			STORE_KEY,
			'getWidgetAreaBlocks',
			widgetArea.id
		);
		const content = serialize( widgetAreaBlocks );
		const path = `/__experimental/widget-areas/${ widgetArea.id }`;
		yield apiFetch( {
			path,
			method: 'POST',
			data: { content },
		} );
	}
}
