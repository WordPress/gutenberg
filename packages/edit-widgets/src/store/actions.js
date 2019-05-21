/**
 * External dependencies
 */
import { get, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { parse, serialize } from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data-controls';

/**
 * Yields an action object that setups the widget areas.
 *
 * @yields {Object} Action object.
 */
export function* setupWidgetAreas() {
	const widgetAreas = yield select(
		'core',
		'getEntityRecords',
		'root',
		'widgetArea'
	);
	yield {
		type: 'SETUP_WIDGET_AREAS',
		widgetAreas: map( widgetAreas, ( { content, ...widgetAreaProperties } ) => {
			return {
				...widgetAreaProperties,
				blocks: parse( get( content, [ 'raw' ], '' ) ),
			};
		} ),
	};
}

/**
 * Returns an action object used to update the blocks in a specific widget area.
 *
 * @param {string}   widgetAreaId Id of the widget area.
 * @param {Object[]} blocks       Array of blocks that should be part of the widget area.
 *
 * @return {Object} Action object.
 */
export function updateBlocksInWidgetArea( widgetAreaId, blocks = [] ) {
	return {
		type: 'UPDATE_BLOCKS_IN_WIDGET_AREA',
		widgetAreaId,
		blocks,
	};
}

/**
 * Action that performs the logic to save widget areas.
 *
 * @yields {Object} Action object.
 */
export function* saveWidgetAreas() {
	const widgetAreas = yield select(
		'core/edit-widgets',
		'getWidgetAreas',
	);
	for ( const { id } of widgetAreas ) {
		const blocks = yield select(
			'core/edit-widgets',
			'getBlocksFromWidgetArea',
			id
		);
		yield dispatch(
			'core',
			'saveWidgetArea',
			{
				id,
				content: serialize( blocks ),
			}
		);
	}
}
