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
import * as persistence from './plugins/persistence';

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

	const persist = persistence.createPersistenceInterface( { storageKey } );

	// Load initially persisted value
	const persisted = persist.get();
	if ( persisted ) {
		const persistedState = {
			...get( reducer( undefined, { type: '@@gutenberg/init' } ), reducerKey ),
			...JSON.parse( persisted ),
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
			persist.set( stateToSave );
		}
	} );
}

/**
 * Higher-order reducer used to persist just one key from the reducer state.
 *
 * @param {function} reducer    Reducer function.
 * @param {string} keyToPersist The reducer key to persist.
 *
 * @return {function} Updated reducer.
 */
export function restrictPersistence( reducer, keyToPersist ) {
	deprecated( 'wp.data.restrictPersistence', {
		alternative: 'registerStore persist option with persistence plugin',
		version: '3.7',
		plugin: 'Gutenberg',
		hint: 'See https://github.com/WordPress/gutenberg/pull/8341 for more details',
	} );

	reducer.__deprecatedKeyToPersist = keyToPersist;

	return reducer;
}

/**
 * Sets a different persistence storage.
 *
 * @param {Object} storage Persistence storage.
 */
export function setPersistenceStorage( storage ) {
	deprecated( 'wp.data.setPersistenceStorage', {
		alternative: 'persistence plugin with storage option',
		version: '3.7',
		plugin: 'Gutenberg',
		hint: 'See https://github.com/WordPress/gutenberg/pull/8341 for more details',
	} );

	const originalCreatePersistenceInterface = persistence.createPersistenceInterface;
	persistence.createPersistenceInterface = ( options ) => {
		originalCreatePersistenceInterface( {
			storage,
			...options,
		} );
	};
}
