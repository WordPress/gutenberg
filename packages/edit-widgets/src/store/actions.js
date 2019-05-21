/**
 * External dependencies
 */
import { get, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';

/**
 * Returns an action object used to setup the widget areas.
 *
 * @param {Object[]} widgetAreas Array of widget area objects.
 *
 * @return {Object} Action object.
 */
export function setupWidgetAreas( widgetAreas = [] ) {
	return {
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
