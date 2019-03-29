/**
 * External dependencies
 */
import { merge, isPlainObject, get } from 'lodash';

/**
 * Internal dependencies
 */
import defaultStorage from './storage/default';
import { combineReducers } from '../../';

/**
 * Persistence plugin options.
 *
 * @property {Storage} storage    Persistent storage implementation. This must
 *                                at least implement `getItem` and `setItem` of
 *                                the Web Storage API.
 * @property {string}  storageKey Key on which to set in persistent storage.
 *
 * @typedef {WPDataPersistencePluginOptions}
 */

/**
 * Default plugin storage.
 *
 * @type {Storage}
 */
const DEFAULT_STORAGE = defaultStorage;

/**
 * Default plugin storage key.
 *
 * @type {string}
 */
const DEFAULT_STORAGE_KEY = 'WP_DATA';

/**
 * Higher-order reducer which invokes the original reducer only if state is
 * inequal from that of the action's `nextState` property, otherwise returning
 * the original state reference.
 *
 * @param {Function} reducer Original reducer.
 *
 * @return {Function} Enhanced reducer.
 */
export const withLazySameState = ( reducer ) => ( state, action ) => {
	if ( action.nextState === state ) {
		return state;
	}

	return reducer( state, action );
};

/**
 * Creates a persistence interface, exposing getter and setter methods (`get`
 * and `set` respectively).
 *
 * @param {WPDataPersistencePluginOptions} options Plugin options.
 *
 * @return {Object} Persistence interface.
 */
export function createPersistenceInterface( options ) {
	const {
		storage = DEFAULT_STORAGE,
		storageKey = DEFAULT_STORAGE_KEY,
	} = options;

	let data;

	/**
	 * Returns the persisted data as an object, defaulting to an empty object.
	 *
	 * @return {Object} Persisted data.
	 */
	function getData() {
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
	function setData( key, value ) {
		data = { ...data, [ key ]: value };
		storage.setItem( storageKey, JSON.stringify( data ) );
	}

	return {
		get: getData,
		set: setData,
	};
}

/**
 * Data plugin to persist store state into a single storage key.
 *
 * @param {WPDataRegistry}                  registry      Data registry.
 * @param {?WPDataPersistencePluginOptions} pluginOptions Plugin options.
 *
 * @return {WPDataPlugin} Data plugin.
 */
const persistencePlugin = function( registry, pluginOptions ) {
	const persistence = createPersistenceInterface( pluginOptions );

	/**
	 * Creates an enhanced store dispatch function, triggering the state of the
	 * given reducer key to be persisted when changed.
	 *
	 * @param {Function}       getState   Function which returns current state.
	 * @param {string}         reducerKey Reducer key.
	 * @param {?Array<string>} keys       Optional subset of keys to save.
	 *
	 * @return {Function} Enhanced dispatch function.
	 */
	function createPersistOnChange( getState, reducerKey, keys ) {
		let getPersistedState;
		if ( Array.isArray( keys ) ) {
			// Given keys, the persisted state should by produced as an object
			// of the subset of keys. This implementation uses combineReducers
			// to leverage its behavior of returning the same object when none
			// of the property values changes. This allows a strict reference
			// equality to bypass a persistence set on an unchanging state.
			const reducers = keys.reduce( ( result, key ) => Object.assign( result, {
				[ key ]: ( state, action ) => action.nextState[ key ],
			} ), {} );

			getPersistedState = withLazySameState( combineReducers( reducers ) );
		} else {
			getPersistedState = ( state, action ) => action.nextState;
		}

		let lastState = getPersistedState( undefined, { nextState: getState() } );

		return () => {
			const state = getPersistedState( lastState, { nextState: getState() } );
			if ( state !== lastState ) {
				persistence.set( reducerKey, state );
				lastState = state;
			}
		};
	}

	return {
		registerStore( reducerKey, options ) {
			if ( ! options.persist ) {
				return registry.registerStore( reducerKey, options );
			}

			// Load from persistence to use as initial state.
			const persistedState = persistence.get()[ reducerKey ];
			if ( persistedState !== undefined ) {
				let initialState = options.reducer( undefined, {
					type: '@@WP/PERSISTENCE_RESTORE',
				} );

				if ( isPlainObject( initialState ) && isPlainObject( persistedState ) ) {
					// If state is an object, ensure that:
					// - Other keys are left intact when persisting only a
					//   subset of keys.
					// - New keys in what would otherwise be used as initial
					//   state are deeply merged as base for persisted value.
					initialState = merge( {}, initialState, persistedState );
				} else {
					// If there is a mismatch in object-likeness of default
					// initial or persisted state, defer to persisted value.
					initialState = persistedState;
				}

				options = {
					...options,
					initialState,
				};
			}

			const store = registry.registerStore( reducerKey, options );

			store.subscribe( createPersistOnChange(
				store.getState,
				reducerKey,
				options.persist
			) );

			return store;
		},
	};
};

/**
 * Deprecated: Remove this function once WordPress 5.3 is released.
 */

persistencePlugin.__unstableMigrate = ( pluginOptions ) => {
	const persistence = createPersistenceInterface( pluginOptions );

	// Preferences migration to introduce the block editor module
	const insertUsage = get( persistence.get(), [
		'core/editor',
		'preferences',
		'insertUsage',
	] );

	if ( insertUsage ) {
		persistence.set( 'core/block-editor', {
			preferences: {
				insertUsage,
			},
		} );
	}
};

export default persistencePlugin;
