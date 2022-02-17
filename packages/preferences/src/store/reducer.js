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
export function featureDefaults( state = {}, action ) {
	if ( action.type === 'SET_FEATURE_DEFAULTS' ) {
		const { scope, defaults } = action;
		return {
			...state,
			[ scope ]: {
				...state[ scope ],
				...defaults,
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
export function features( state = {}, action ) {
	if ( action.type === 'SET_FEATURE_VALUE' ) {
		const { scope, featureName, value } = action;
		return {
			...state,
			[ scope ]: {
				...state[ scope ],
				[ featureName ]: value,
			},
		};
	}

	return state;
}

export default combineReducers( {
	featureDefaults,
	features,
} );
