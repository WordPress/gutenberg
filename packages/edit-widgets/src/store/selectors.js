/**
 * External dependencies
 */
import { toArray } from 'lodash';
import createSelector from 'rememo';

/**
 * Returns an array of widget areas.
 *
 * @param {Object} state Widget editor state.
 * @return {Object[]} Array of widget areas.
 */
export const getWidgetAreas = createSelector(
	( state ) => ( toArray( state.widgetAreas ) ),
	( state ) => [ state.widgetAreas ]
);

/**
 * Returns a widget area object.
 *
 * @param {Object} state        Widget editor state.
 * @param {string} widgetAreaId Id of the widget area.
 * @return {Object} Array of widget areas.
 */
export function getWidgetArea( state, widgetAreaId ) {
	return state.widgetAreas[ widgetAreaId ];
}

/**
 * Returns an array of blocks part of a widget area.
 *
 * @param {Object} state        Widget editor state.
 * @param {string} widgetAreaId Id of the widget area.
 * @return {Object[]} Array of blocks.
 */
export function getBlocksFromWidgetArea( state, widgetAreaId ) {
	return state.widgetAreaBlocks[ widgetAreaId ];
}
