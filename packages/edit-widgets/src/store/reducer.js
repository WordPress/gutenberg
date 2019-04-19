/**
 * External dependencies
 */
import { keyBy, mapValues, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

export function widgetAreas( state = {}, action ) {
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

export function widgetAreaEditors( state = {}, action ) {
	switch ( action.type ) {
		case 'SETUP_WIDGET_AREAS':
			return mapValues(
				keyBy( action.widgetAreas, 'id' ),
				( value ) => pick( value, [
					'blocks',
				] )
			);
		case 'UPDATE_BLOCKS_IN_WIDGET_AREA': {
			const area = state[ action.widgetAreaId ] || {};
			// check if change is required
			if ( area.blocks === action.blocks ) {
				return state;
			}
			return {
				...state,
				[ action.widgetAreaId ]: {
					...area,
					blocks: action.blocks,
				},
			};
		}
	}

	return state;
}

export default combineReducers( {
	widgetAreas,
	widgetAreaEditors,
} );
