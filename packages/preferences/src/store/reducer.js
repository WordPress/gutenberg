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
 * Higher order reducer that does the following:
 * - Merges any data from the persistence layer into the state when the
 *   `SET_PERSISTENCE_LAYER` action is received.
 * - Passes any preferences changes to the persistence layer.
 *
 * @param {Function} reducer The preferences reducer.
 *
 * @return {Function} The enhanced reducer.
 */
function withPersistenceLayer( reducer ) {
	let persistenceLayer;

	return ( state, action ) => {
		// Setup the persistence layer, and return the persisted data
		// as the state.
		if ( action.type === 'SET_PERSISTENCE_LAYER' ) {
			const { persistenceLayer: persistence, persistedData } = action;
			persistenceLayer = persistence;
			return persistedData;
		}

		const nextState = reducer( state, action );
		if ( action.type === 'SET_PREFERENCE_VALUE' ) {
			persistenceLayer?.set( nextState );
		}

		return nextState;
	};
}

/**
 * Reducer returning the user preferences.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export const preferences = withPersistenceLayer( ( state = {}, action ) => {
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
} );

const PROXIED_ACTIONS = [ 'SET_PREFERENCE_VALUE', 'SET_PREFERENCE_DEFAULTS' ];
function withProxiedScope( reducer ) {
	return ( state, action ) => {
		const { scope, type } = action;
		if (
			PROXIED_ACTIONS.includes( type ) &&
			state?.scopeProxies[ scope ]
		) {
			const proxiedScope = state.scopeProxies[ scope ];
			const updatedAction = {
				...action,
				scope: proxiedScope ?? scope,
			};
			return reducer( state, updatedAction );
		}
		reducer( state, action );
	};
}

function scopeProxies( state, action ) {
	if ( action.type === 'SET_SCOPE_PROXY' ) {
		const { fromScope, toScope } = action;

		return {
			...state,
			[ fromScope ]: toScope,
		};
	}

	return state;
}

export default withProxiedScope(
	combineReducers( {
		defaults,
		preferences,
		scopeProxies,
	} )
);
