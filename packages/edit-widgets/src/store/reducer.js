/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal to edit-widgets package.
 *
 * Stores widgetId -> clientId mapping which is necessary for saving the navigation.
 *
 * @param {Object} state Redux state
 * @param {Object} action Redux action
 * @return {Object} Updated state
 */
export function mapping( state, action ) {
	const { type, ...rest } = action;
	if ( type === 'SET_WIDGET_TO_CLIENT_ID_MAPPING' ) {
		return rest.mapping;
	}
	if ( type === 'SET_WIDGET_ID_FOR_CLIENT_ID' ) {
		const newMapping = {
			...state,
		};
		newMapping[ action.widgetId ] = action.clientId;
		return newMapping;
	}

	return state || {};
}

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

export default combineReducers( {
	mapping,
	widgetAreasOpenState,
} );
