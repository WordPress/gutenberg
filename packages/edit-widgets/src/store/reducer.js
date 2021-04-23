/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Controls the open state of the widget areas.
 *
 * @param {Object} state   Redux state
 * @param {Object} action  Redux action
 * @return {Array}         Updated state
 */
export function widgetAreasOpenState( state = {}, action ) {
	const { type } = action;
	switch ( type ) {
		case 'SET_WIDGET_AREAS_OPEN_STATE': {
			return action.widgetAreasOpenState;
		}
		case 'SET_IS_WIDGET_AREA_OPEN': {
			const { clientId, isOpen } = action;
			return {
				...state,
				[ clientId ]: isOpen,
			};
		}
		default: {
			return state;
		}
	}
}

/**
 * Reducer tracking whether the inserter is open.
 *
 * @param {boolean|Object} state
 * @param {Object}         action
 */
function blockInserterPanel( state = false, action ) {
	switch ( action.type ) {
		case 'SET_IS_INSERTER_OPENED':
			return action.value;
	}
	return state;
}

export default combineReducers( {
	blockInserterPanel,
	widgetAreasOpenState,
} );
