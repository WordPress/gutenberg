/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { subscribe, dispatch, getState } from '@wordpress/data';

/**
 * Adds the rehydratation behavior to redux reducers
 *
 * @param {Function}   reducer     The reducer to enhance
 * @param {String}     reducerKey  The reducer key to persist
 *
 * @return {Function}              Enhanced reducer
 */
export function withRehydratation( reducer, reducerKey ) {
	// EnhancedReducer with auto-rehydration
	const enhancedReducer = ( state, action ) => {
		const nextState = reducer( state, action );

		if ( action.type === 'REDUX_REHYDRATE' ) {
			return {
				...nextState,
				[ reducerKey ]: action.payload,
			};
		}

		return nextState;
	};

	return enhancedReducer;
}

/**
 * Loads the initial state and persist on changes
 *
 * This should be executed after the reducer's registration
 *
 * @param {String}     reducerKey  The reducer key to persist (example: reducerKey.subReducerKey)
 * @param {String}     storageKey  The storage key to use
 * @param {Object}     defaults    Default values of the reducer key
 */
export function loadAndPersist( reducerKey, storageKey, defaults = {} ) {
	// Load initially persisted value
	const persistedString = window.localStorage.getItem( storageKey );
	if ( persistedString ) {
		const persistedState = {
			...defaults,
			...JSON.parse( persistedString ),
		};

		dispatch( {
			type: 'REDUX_REHYDRATE',
			payload: persistedState,
		} );
	}

	// Persist updated preferences
	let currentStateValue = get( getState(), reducerKey );
	subscribe( () => {
		const newStateValue = get( getState(), reducerKey );
		if ( newStateValue !== currentStateValue ) {
			currentStateValue = newStateValue;
			window.localStorage.setItem( storageKey, JSON.stringify( currentStateValue ) );
		}
	} );
}
