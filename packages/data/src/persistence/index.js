/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * Internal dependencies
 */
import defaultStorage from './storage/default';

/**
 * Persistence options.
 *
 * @property {Storage} storage    Persistent storage implementation. This must
 *                                at least implement `getItem` and `setItem` of
 *                                the Web Storage API.
 * @property {string}  storageKey Key on which to set in persistent storage.
 *
 * @typedef {WPDataPersistenceOptions}
 */

/**
  * Default persistence options.
  */
let DEFAULT_OPTIONS = {
	storage: defaultStorage,
	storageKey: 'WP_DATA',
};

/**
 * Sets default options for the persistence.
 * This function merges the options given with the defaults already set.
 *
 * @param {WPDataPersistenceOptions} options The defaults to be set (e.g. 'storage', or 'storageKey')
 */
export function setDefaults( options ) {
	DEFAULT_OPTIONS = { ...DEFAULT_OPTIONS, ...options };
}

/**
 * Higher-order reducer to provides an initial value when state is undefined.
 *
 * @param {Function} reducer      Original reducer.
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
 * Creates a persistence interface, exposing getter and setter methods (`get`
 * and `set` respectively).
 *
 * @param {WPDataPersistenceOptions} options Persistence options.
 *
 * @return {Object} Persistence interface.
 */
export function createPersistenceInterface( options ) {
	const { storage, storageKey } = { ...DEFAULT_OPTIONS, ...options };

	let data;

	/**
	 * Returns the persisted data as an object, defaulting to an empty object.
	 *
	 * @return {Object} Persisted data.
	 */
	function get() {
		if ( data === undefined ) {
			// If unset, getItem is expected to return null. Fall back to
			// empty object.
			const persisted = storage.getItem( storageKey );
			if ( persisted === null ) {
				data = {};
			} else {
				try {
					data = JSON.parse( persisted );
				} catch ( error ) {
					// Similarly, should any error be thrown during parse of
					// the string (malformed JSON), fall back to empty object.
					data = {};
				}
			}
		}

		return data;
	}

	/**
	 * Merges an updated reducer state into the persisted data.
	 *
	 * @param {string} key   Key to update.
	 * @param {*}      value Updated value.
	 */
	function set( key, value ) {
		data = { ...data, [ key ]: value };
		storage.setItem( storageKey, JSON.stringify( data ) );
	}

	return { get, set };
}

/**
 * Creates an enhanced store dispatch function, triggering the state of the
 * given reducer key to be persisted when changed.
 *
 * @param {Function}       getState    Function which returns current state.
 * @param {string}         reducerKey  Reducer key.
 * @param {?Array<string>} keys        Optional subset of keys to save.
 * @param {Object}         persistence The persistence interface to be used.
 *
 * @return {Function} Enhanced dispatch function.
 */
export function createPersistOnChange( getState, reducerKey, keys, persistence ) {
	let lastState = getState();

	return ( result ) => {
		let state = getState();
		if ( state !== lastState ) {
			if ( Array.isArray( keys ) ) {
				state = pick( state, keys );
			}

			persistence.set( reducerKey, state );
			lastState = state;
		}

		return result;
	};
}
