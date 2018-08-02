/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * Internal dependencies
 */
import defaultStorage from './storage/default';

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
	function get() {
		if ( data === undefined ) {
			const persisted = storage.getItem( storageKey );
			try {
				data = JSON.parse( persisted );
			} catch ( error ) {
				data = {};
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
 * Data plugin to persist store state into a single storage key.
 *
 * @param {WPDataRegistry}                  registry      Data registry.
 * @param {?WPDataPersistencePluginOptions} pluginOptions Plugin options.
 *
 * @return {WPDataPlugin} Data plugin.
 */
export default function( registry, pluginOptions ) {
	const persistence = createPersistenceInterface( pluginOptions );

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
	function createPersistMiddleware( reducerKey, keys, initialState ) {
		let lastState = initialState;

		return ( store ) => ( next ) => ( action ) => {
			const result = next( action );

			let state = store.getState();
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

	return {
		registerStore( reducerKey, options ) {
			if ( options.persist ) {
				const initialState = persistence.get()[ reducerKey ];

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
