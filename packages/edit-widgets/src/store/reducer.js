/**
 * External dependencies
 */
import { keyBy, mapValues, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer storing some properties of each widget area.
 *
 * @param {Array}  state  Current state.
 * @param {Object} action Action object.
 *
 * @return {Array} Updated state.
 */
export function widgetAreas( state = {}, action = {} ) {
	switch ( action.type ) {
		case 'SETUP_WIDGET_AREAS':
			return mapValues(
				keyBy( action.widgetAreas, 'id' ),
				( value ) => pick( value, [
					'name',
					'id',
					'description',
				] )
			);
	}

	return state;
}

/**
 * Reducer storing the blocks part of each widget area.
 *
 * @param {Array}  state  Current state.
 * @param {Object} action Action object.
 *
 * @return {Array} Updated state.
 */
export function widgetAreaBlocks( state = {}, action = {} ) {
	switch ( action.type ) {
		case 'SETUP_WIDGET_AREAS':
			return mapValues(
				keyBy( action.widgetAreas, 'id' ),
				( value ) => value.blocks
			);
		case 'UPDATE_BLOCKS_IN_WIDGET_AREA': {
			const blocks = state[ action.widgetAreaId ] || [];
			// check if change is required
			if ( blocks === action.blocks ) {
				return state;
			}
			return {
				...state,
				[ action.widgetAreaId ]: action.blocks,
			};
		}
	}

	return state;
}

export default combineReducers( {
	widgetAreas,
	widgetAreaBlocks,
} );
