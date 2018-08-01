/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * Internal dependencies
 */
import defaultStorage from './storage/default';

/**
 * The persistent storage implementation.
 *
 * @type {Storage}
 */
let _storage = defaultStorage;

/**
 * The key on which to set in the persistent storage.
 *
 * @type {string}
 */
let _storageKey = 'WP_DATA';

/**
 * Returns the persisted data as an object.
 *
 * @return {Object} Persisted data.
 */
export function getPersistedData() {
	const { getStorage, getStorageKey } = plugin;
	const persisted = getStorage().getItem( getStorageKey() );
	try {
		return JSON.parse( persisted );
	} catch ( error ) {
		return {};
	}
}

/**
 * Merges an updated reducer state into the persisted data.
 *
 * @param {string} reducerKey   Reducer key to update.
 * @param {*}      reducerState Updated reducer key state.
 */
export function setPersistedData( reducerKey, reducerState ) {
	const { getStorage, getStorageKey } = plugin;
	const data = {
		...getPersistedData(),
		[ reducerKey ]: reducerState,
	};

	getStorage().setItem( getStorageKey(), JSON.stringify( data ) );
}

/**
 * Creates a data middleware for a given reducer key, triggering its state to
 * be persisted when changed.
 *
 * @param {string}         reducerKey   Reducer key.
 * @param {?Array<string>} keys         Optional array of keys to use in saving
 *                                      only a subset of the new state.
 * @param {?*}             initialState Optional initial state.
 *
 * @return {Function} Data middleware.
 */
export function createPersistMiddleware( reducerKey, keys, initialState ) {
	let lastState = initialState;

	return ( store ) => ( next ) => ( action ) => {
		const result = next( action );

		let state = store.getState();
		if ( state !== lastState ) {
			if ( Array.isArray( keys ) ) {
				state = pick( state, keys );
			}

			setPersistedData( reducerKey, state );
			lastState = state;
		}

		return result;
	};
}

/**
 * Higher-order reducer to provides an initial value when state is undefined.
 *
 * @param {Functigon} reducer      Original reducer.
 * @param {*}         initialState Value to use as initial state.
 *
 * @return {Function} Enhanced reducer.
 */
export function withInitialState( reducer, initialState ) {
	return ( state = initialState, action ) => {
		return reducer( state, action );
	};
}

/**
 * Data plugin to persist store state into a single storage key.
 *
 * @param {WPDataRegistry} registry Data registry.
 *
 * @return {WPDataPlugin} Data plugin.
 */
function plugin( registry ) {
	return {
		registerStore( reducerKey, options ) {
			if ( options.persist ) {
				const initialState = getPersistedData()[ reducerKey ];

				options = {
					...options,
					middlewares: [
						...( options.middlewares || [] ),
						createPersistMiddleware(
							reducerKey,
							options.persist,
							initialState
						),
					],
					reducer: withInitialState( options.reducer, initialState ),
				};
			}

			return registry.registerStore( reducerKey, options );
		},
	};
}

/**
 * Assign the persistent storage implementation. At minimum, this should
 * implement `getItem` and `setItem` of the Web Storage API.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Storage
 *
 * @param {Storage} storage Persistence storage.
 */
plugin.setStorage = function( storage ) {
	_storage = storage;
};

/**
 * Returns the persistence storage handler.
 *
 * @return {Storage} Persistence storage.
 */
plugin.getStorage = function() {
	return _storage;
};

/**
 * Assigns the key on which to set in the persistent storage.
 *
 * @param {string} storageKey Storage key.
 */
plugin.setStorageKey = function( storageKey ) {
	_storageKey = storageKey;
};

/**
 * Returns the key on which to set in the persistent storage.
 *
 * @return {string} storageKey Storage key.
 */
plugin.getStorageKey = function() {
	return _storageKey;
};

export default plugin;
