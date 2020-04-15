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
 * Reducer returning the user preferences.
 *
 * @param {Object}  state Current state.
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

/**
 * Reducer returning the editing canvas device type.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function deviceType( state = 'Desktop', action ) {
	switch ( action.type ) {
		case 'SET_PREVIEW_DEVICE_TYPE':
			return action.deviceType;
	}

	return state;
}

/** Reducer returning state for the save panel.
 *
 * @param {Object} state  Current state.
 * @param {Object} action  Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function entitiesSavedStates(
	state = { isOpen: false, onRequestClose: () => {} },
	action
) {
	switch ( action.type ) {
		case 'OPEN_ENTITIES_SAVED_STATES':
			return {
				...state,
				isOpen: true,
				onRequestClose: action.onRequestClose || function() {},
			};
		case 'CLOSE_ENTITIES_SAVED_STATES':
			state.onRequestClose( action.callbackArg );
			return {
				...state,
				isOpen: false,
				onRequestClose: () => {},
			};
	}

	return state;
}

export default combineReducers( {
	preferences,
	deviceType,
	entitiesSavedStates,
} );
