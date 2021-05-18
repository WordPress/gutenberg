/**
 * External dependencies
 */
import { flow } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS } from './defaults';

/**
 * Higher-order reducer creator which provides the given initial state for the
 * original reducer.
 *
 * @param {*} initialState Initial state to provide to reducer.
 *
 * @return {Function} Higher-order reducer.
 */
const createWithInitialState = ( initialState ) => ( reducer ) => {
	return ( state = initialState, action ) => reducer( state, action );
};

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

/**
 * Reducer returning the user preferences.
 *
 * @param {Object}  state                           Current state.
 * @param {Object}  action                          Dispatched action.
 *
 * @return {Object} Updated state.
 */
export const preferences = flow( [
	combineReducers,
	createWithInitialState( PREFERENCES_DEFAULTS ),
] )( {
	features( state, action ) {
		if ( action.type === 'TOGGLE_FEATURE' ) {
			return {
				...state,
				[ action.feature ]: ! state[ action.feature ],
			};
		}

		return state;
	},
} );

export default combineReducers( {
	blockInserterPanel,
	widgetAreasOpenState,
	preferences,
} );
