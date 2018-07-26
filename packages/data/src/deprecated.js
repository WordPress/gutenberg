/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { getPersistenceStorage } from './persist';

/**
 * Adds the rehydration behavior to redux reducers.
 *
 * @param {Function} reducer    The reducer to enhance.
 * @param {string}   reducerKey The reducer key to persist.
 * @param {string}   storageKey The storage key to use.
 *
 * @return {Function} Enhanced reducer.
 */
export function withRehydration( reducer, reducerKey, storageKey ) {
	deprecated( 'wp.data.withRehydration', {
		version: '3.6',
		plugin: 'Gutenberg',
		hint: 'See https://github.com/WordPress/gutenberg/pull/8146 for more details',
	} );

	// EnhancedReducer with auto-rehydration
	const enhancedReducer = ( state, action ) => {
		const nextState = reducer( state, action );

		if ( action.type === 'REDUX_REHYDRATE' && action.storageKey === storageKey ) {
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
 * Loads the initial state and persist on changes.
 *
 * This should be executed after the reducer's registration.
 *
 * @param {Object}   store      Store to enhance.
 * @param {Function} reducer    The reducer function. Used to get default values and to allow custom serialization by the reducers.
 * @param {string}   reducerKey The reducer key to persist (example: reducerKey.subReducerKey).
 * @param {string}   storageKey The storage key to use.
 */
export function loadAndPersist( store, reducer, reducerKey, storageKey ) {
	deprecated( 'wp.data.loadAndPersist', {
		version: '3.6',
		plugin: 'Gutenberg',
		hint: 'See https://github.com/WordPress/gutenberg/pull/8146 for more details',
	} );

	// Load initially persisted value
	const persistedString = getPersistenceStorage().getItem( storageKey );
	if ( persistedString ) {
		const persistedState = {
			...get( reducer( undefined, { type: '@@gutenberg/init' } ), reducerKey ),
			...JSON.parse( persistedString ),
		};

		store.dispatch( {
			type: 'REDUX_REHYDRATE',
			payload: persistedState,
			storageKey,
		} );
	}

	// Persist updated preferences
	let currentStateValue = get( store.getState(), reducerKey );
	store.subscribe( () => {
		const newStateValue = get( store.getState(), reducerKey );
		if ( newStateValue !== currentStateValue ) {
			currentStateValue = newStateValue;
			const stateToSave = get( reducer( store.getState(), { type: 'SERIALIZE' } ), reducerKey );
			getPersistenceStorage().setItem( storageKey, JSON.stringify( stateToSave ) );
		}
	} );
}
