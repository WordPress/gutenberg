/**
 * External dependencies
 */
// @ts-expect-error -- is-plain-object types don't resolve with package.json "exports".
import { isPlainObject } from 'is-plain-object';
import deepmerge from 'deepmerge';

/**
 * Internal dependencies
 */
import defaultStorage from './storage/default';
import { combineReducers } from '../../';
import type {
	DataRegistry,
	ReduxStoreConfig,
	StorageInterface,
} from '../../types';

interface PersistencePluginOptions {
	/**
	 * Persistent storage implementation. This must
	 * at least implement `getItem` and `setItem` of
	 * the Web Storage API.
	 */
	storage?: StorageInterface;
	/**
	 * Key on which to set in persistent storage.
	 */
	storageKey?: string;
}

interface PersistenceInterface {
	get: () => Record< string, unknown >;
	set: ( key: string, value: unknown ) => void;
}

/**
 * Default plugin storage.
 */
const DEFAULT_STORAGE = defaultStorage;

/**
 * Default plugin storage key.
 */
const DEFAULT_STORAGE_KEY = 'WP_DATA';

/**
 * Higher-order reducer which invokes the original reducer only if state is
 * inequal from that of the action's `nextState` property, otherwise returning
 * the original state reference.
 *
 * @param reducer Original reducer.
 *
 * @return Enhanced reducer.
 */
export const withLazySameState =
	( reducer: ( state: any, action: any ) => any ) =>
	( state: unknown, action: { nextState: unknown } ) => {
		if ( action.nextState === state ) {
			return state;
		}

		return reducer( state, action );
	};

/**
 * Creates a persistence interface, exposing getter and setter methods (`get`
 * and `set` respectively).
 *
 * @param options Plugin options.
 *
 * @return Persistence interface.
 */
export function createPersistenceInterface(
	options: PersistencePluginOptions
): PersistenceInterface {
	const { storage = DEFAULT_STORAGE, storageKey = DEFAULT_STORAGE_KEY } =
		options;

	let data: Record< string, unknown > | undefined;

	/**
	 * Returns the persisted data as an object, defaulting to an empty object.
	 *
	 * @return Persisted data.
	 */
	function getData(): Record< string, unknown > {
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

		return data!;
	}

	/**
	 * Merges an updated reducer state into the persisted data.
	 *
	 * @param key   Key to update.
	 * @param value Updated value.
	 */
	function setData( key: string, value: unknown ): void {
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
 * @param registry      Data registry.
 * @param pluginOptions Plugin options.
 *
 * @return Data plugin.
 */
function persistencePlugin(
	registry: DataRegistry,
	pluginOptions: PersistencePluginOptions
): Partial< DataRegistry > {
	const persistence = createPersistenceInterface( pluginOptions );

	/**
	 * Creates an enhanced store dispatch function, triggering the state of the
	 * given store name to be persisted when changed.
	 *
	 * @param getState  Function which returns current state.
	 * @param storeName Store name.
	 * @param keys      Optional subset of keys to save.
	 *
	 * @return Enhanced dispatch function.
	 */
	function createPersistOnChange(
		getState: () => unknown,
		storeName: string,
		keys: boolean | string[]
	): () => void {
		let getPersistedState: ( state: any, action: any ) => any;
		if ( Array.isArray( keys ) ) {
			// Given keys, the persisted state should by produced as an object
			// of the subset of keys. This implementation uses combineReducers
			// to leverage its behavior of returning the same object when none
			// of the property values changes. This allows a strict reference
			// equality to bypass a persistence set on an unchanging state.
			const reducers = keys.reduce(
				(
					accumulator: Record<
						string,
						( state: any, action: any ) => any
					>,
					key: string
				) =>
					Object.assign( accumulator, {
						[ key ]: (
							state: unknown,
							action: { nextState: Record< string, unknown > }
						) => action.nextState[ key ],
					} ),
				{}
			);

			getPersistedState = withLazySameState(
				combineReducers( reducers )
			);
		} else {
			getPersistedState = (
				_state: unknown,
				action: { nextState: unknown }
			) => action.nextState;
		}

		let lastState = getPersistedState( undefined, {
			nextState: getState(),
		} );

		return () => {
			const state = getPersistedState( lastState, {
				nextState: getState(),
			} );
			if ( state !== lastState ) {
				persistence.set( storeName, state );
				lastState = state;
			}
		};
	}

	return {
		registerStore(
			storeName: string,
			options: ReduxStoreConfig< any, any, any > & {
				persist?: boolean | string[];
			}
		) {
			if ( ! options.persist ) {
				return registry.registerStore( storeName, options );
			}

			// Load from persistence to use as initial state.
			const persistedState = persistence.get()[ storeName ];
			if ( persistedState !== undefined ) {
				let initialState = options.reducer( options.initialState, {
					type: '@@WP/PERSISTENCE_RESTORE',
				} );

				if (
					isPlainObject( initialState ) &&
					isPlainObject( persistedState )
				) {
					// If state is an object, ensure that:
					// - Other keys are left intact when persisting only a
					//   subset of keys.
					// - New keys in what would otherwise be used as initial
					//   state are deeply merged as base for persisted value.
					initialState = deepmerge(
						initialState as Record< string, unknown >,
						persistedState as Record< string, unknown >,
						{
							isMergeableObject: isPlainObject,
						}
					);
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

			const store = registry.registerStore( storeName, options );

			store.subscribe(
				createPersistOnChange(
					store.getState,
					storeName,
					options.persist!
				)
			);

			return store;
		},
	};
}

export default Object.assign( persistencePlugin, {
	__unstableMigrate: () => {},
} );
