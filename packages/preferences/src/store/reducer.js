/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer returning the defaults for user preferences.
 *
 * This is kept intentionally separate from the preferences
 * themselves so that defaults are not persisted.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function defaults( state = {}, action ) {
	if ( action.type === 'SET_PREFERENCE_DEFAULTS' ) {
		const { scope, defaults: values } = action;
		return {
			...state,
			[ scope ]: {
				...state[ scope ],
				...values,
			},
		};
	}

	return state;
}

/**
 * Reducer returning the user preferences.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function preferences( state = {}, action ) {
	if ( action.type === 'SET_PREFERENCE_VALUE' ) {
		const { scope, name, value } = action;
		return {
			...state,
			[ scope ]: {
				...state[ scope ],
				[ name ]: value,
			},
		};
	}

	return state;
}

export default combineReducers( {
	defaults,
	preferences,
} );
