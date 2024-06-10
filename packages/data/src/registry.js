/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import createReduxStore from './redux-store';
import coreDataStore from './store';
import { createEmitter } from './utils/emitter';
import { lock, unlock } from './lock-unlock';

/** @typedef {import('./types').StoreDescriptor} StoreDescriptor */

/**
 * @typedef {Object} WPDataRegistry An isolated orchestrator of store registrations.
 *
 * @property {Function} registerGenericStore Given a namespace key and settings
 *                                           object, registers a new generic
 *                                           store.
 * @property {Function} registerStore        Given a namespace key and settings
 *                                           object, registers a new namespace
 *                                           store.
 * @property {Function} subscribe            Given a function callback, invokes
 *                                           the callback on any change to state
 *                                           within any registered store.
 * @property {Function} select               Given a namespace key, returns an
 *                                           object of the  store's registered
 *                                           selectors.
 * @property {Function} dispatch             Given a namespace key, returns an
 *                                           object of the store's registered
 *                                           action dispatchers.
 */

/**
 * @typedef {Object} WPDataPlugin An object of registry function overrides.
 *
 * @property {Function} registerStore registers store.
 */

function getStoreName( storeNameOrDescriptor ) {
	return typeof storeNameOrDescriptor === 'string'
		? storeNameOrDescriptor
		: storeNameOrDescriptor.name;
}
/**
 * Creates a new store registry, given an optional object of initial store
 * configurations.
 *
 * @param {Object}  storeConfigs Initial store configurations.
 * @param {Object?} parent       Parent registry.
 *
 * @return {WPDataRegistry} Data registry.
 */
export function createRegistry( storeConfigs = {}, parent = null ) {
	const stores = {};
	const emitter = createEmitter();
	let listeningStores = null;

	/**
	 * Global listener called for each store's update.
	 */
	function globalListener() {
		emitter.emit();
	}

	/**
	 * Subscribe to changes to any data, either in all stores in registry, or
	 * in one specific store.
	 *
	 * @param {Function}                listener              Listener function.
	 * @param {string|StoreDescriptor?} storeNameOrDescriptor Optional store name.
	 *
	 * @return {Function} Unsubscribe function.
	 */
	const subscribe = ( listener, storeNameOrDescriptor ) => {
		// subscribe to all stores
		if ( ! storeNameOrDescriptor ) {
			return emitter.subscribe( listener );
		}

		// subscribe to one store
		const storeName = getStoreName( storeNameOrDescriptor );
		const store = stores[ storeName ];
		if ( store ) {
			return store.subscribe( listener );
		}

		// Trying to access a store that hasn't been registered,
		// this is a pattern rarely used but seen in some places.
		// We fallback to global `subscribe` here for backward-compatibility for now.
		// See https://github.com/WordPress/gutenberg/pull/27466 for more info.
		if ( ! parent ) {
			return emitter.subscribe( listener );
		}

		return parent.subscribe( listener, storeNameOrDescriptor );
	};

	/**
	 * Calls a selector given the current state and extra arguments.
	 *
	 * @param {string|StoreDescriptor} storeNameOrDescriptor Unique namespace identifier for the store
	 *                                                       or the store descriptor.
	 *
	 * @return {*} The selector's returned value.
	 */
	function select( storeNameOrDescriptor ) {
		const storeName = getStoreName( storeNameOrDescriptor );
		listeningStores?.add( storeName );
		const store = stores[ storeName ];
		if ( store ) {
			return store.getSelectors();
		}

		return parent?.select( storeName );
	}

	function __unstableMarkListeningStores( callback, ref ) {
		listeningStores = new Set();
		try {
			return callback.call( this );
		} finally {
			ref.current = Array.from( listeningStores );
			listeningStores = null;
		}
	}

	/**
	 * Given a store descriptor, returns an object containing the store's selectors pre-bound to
	 * state so that you only need to supply additional arguments, and modified so that they return
	 * promises that resolve to their eventual values, after any resolvers have ran.
	 *
	 * @param {StoreDescriptor|string} storeNameOrDescriptor The store descriptor. The legacy calling
	 *                                                       convention of passing the store name is
	 *                                                       also supported.
	 *
	 * @return {Object} Each key of the object matches the name of a selector.
	 */
	function resolveSelect( storeNameOrDescriptor ) {
		const storeName = getStoreName( storeNameOrDescriptor );
		listeningStores?.add( storeName );
		const store = stores[ storeName ];
		if ( store ) {
			return store.getResolveSelectors();
		}

		return parent && parent.resolveSelect( storeName );
	}

	/**
	 * Given a store descriptor, returns an object containing the store's selectors pre-bound to
	 * state so that you only need to supply additional arguments, and modified so that they throw
	 * promises in case the selector is not resolved yet.
	 *
	 * @param {StoreDescriptor|string} storeNameOrDescriptor The store descriptor. The legacy calling
	 *                                                       convention of passing the store name is
	 *                                                       also supported.
	 *
	 * @return {Object} Object containing the store's suspense-wrapped selectors.
	 */
	function suspendSelect( storeNameOrDescriptor ) {
		const storeName = getStoreName( storeNameOrDescriptor );
		listeningStores?.add( storeName );
		const store = stores[ storeName ];
		if ( store ) {
			return store.getSuspendSelectors();
		}

		return parent && parent.suspendSelect( storeName );
	}

	/**
	 * Returns the available actions for a part of the state.
	 *
	 * @param {string|StoreDescriptor} storeNameOrDescriptor Unique namespace identifier for the store
	 *                                                       or the store descriptor.
	 *
	 * @return {*} The action's returned value.
	 */
	function dispatch( storeNameOrDescriptor ) {
		const storeName = getStoreName( storeNameOrDescriptor );
		const store = stores[ storeName ];
		if ( store ) {
			return store.getActions();
		}

		return parent && parent.dispatch( storeName );
	}

	//
	// Deprecated
	// TODO: Remove this after `use()` is removed.
	function withPlugins( attributes ) {
		return Object.fromEntries(
			Object.entries( attributes ).map( ( [ key, attribute ] ) => {
				if ( typeof attribute !== 'function' ) {
					return [ key, attribute ];
				}
				return [
					key,
					function () {
						return registry[ key ].apply( null, arguments );
					},
				];
			} )
		);
	}

	/**
	 * Registers a store instance.
	 *
	 * @param {string}   name        Store registry name.
	 * @param {Function} createStore Function that creates a store object (getSelectors, getActions, subscribe).
	 */
	function registerStoreInstance( name, createStore ) {
		if ( stores[ name ] ) {
			// eslint-disable-next-line no-console
			console.error( 'Store "' + name + '" is already registered.' );
			return stores[ name ];
		}

		const store = createStore();

		if ( typeof store.getSelectors !== 'function' ) {
			throw new TypeError( 'store.getSelectors must be a function' );
		}
		if ( typeof store.getActions !== 'function' ) {
			throw new TypeError( 'store.getActions must be a function' );
		}
		if ( typeof store.subscribe !== 'function' ) {
			throw new TypeError( 'store.subscribe must be a function' );
		}
		// The emitter is used to keep track of active listeners when the registry
		// get paused, that way, when resumed we should be able to call all these
		// pending listeners.
		store.emitter = createEmitter();
		const currentSubscribe = store.subscribe;
		store.subscribe = ( listener ) => {
			const unsubscribeFromEmitter = store.emitter.subscribe( listener );
			const unsubscribeFromStore = currentSubscribe( () => {
				if ( store.emitter.isPaused ) {
					store.emitter.emit();
					return;
				}
				listener();
			} );

			return () => {
				unsubscribeFromStore?.();
				unsubscribeFromEmitter?.();
			};
		};
		stores[ name ] = store;
		store.subscribe( globalListener );

		// Copy private actions and selectors from the parent store.
		if ( parent ) {
			try {
				unlock( store.store ).registerPrivateActions(
					unlock( parent ).privateActionsOf( name )
				);
				unlock( store.store ).registerPrivateSelectors(
					unlock( parent ).privateSelectorsOf( name )
				);
			} catch ( e ) {
				// unlock() throws if store.store was not locked.
				// The error indicates there's nothing to do here so let's
				// ignore it.
			}
		}

		return store;
	}

	/**
	 * Registers a new store given a store descriptor.
	 *
	 * @param {StoreDescriptor} store Store descriptor.
	 */
	function register( store ) {
		registerStoreInstance( store.name, () =>
			store.instantiate( registry )
		);
	}

	function registerGenericStore( name, store ) {
		deprecated( 'wp.data.registerGenericStore', {
			since: '5.9',
			alternative: 'wp.data.register( storeDescriptor )',
		} );
		registerStoreInstance( name, () => store );
	}

	/**
	 * Registers a standard `@wordpress/data` store.
	 *
	 * @param {string} storeName Unique namespace identifier.
	 * @param {Object} options   Store description (reducer, actions, selectors, resolvers).
	 *
	 * @return {Object} Registered store object.
	 */
	function registerStore( storeName, options ) {
		if ( ! options.reducer ) {
			throw new TypeError( 'Must specify store reducer' );
		}

		const store = registerStoreInstance( storeName, () =>
			createReduxStore( storeName, options ).instantiate( registry )
		);

		return store.store;
	}

	function batch( callback ) {
		// If we're already batching, just call the callback.
		if ( emitter.isPaused ) {
			callback();
			return;
		}

		emitter.pause();
		Object.values( stores ).forEach( ( store ) => store.emitter.pause() );
		try {
			callback();
		} finally {
			emitter.resume();
			Object.values( stores ).forEach( ( store ) =>
				store.emitter.resume()
			);
		}
	}

	let registry = {
		batch,
		stores,
		namespaces: stores, // TODO: Deprecate/remove this.
		subscribe,
		select,
		resolveSelect,
		suspendSelect,
		dispatch,
		use,
		register,
		registerGenericStore,
		registerStore,
		__unstableMarkListeningStores,
	};

	//
	// TODO:
	// This function will be deprecated as soon as it is no longer internally referenced.
	function use( plugin, options ) {
		if ( ! plugin ) {
			return;
		}

		registry = {
			...registry,
			...plugin( registry, options ),
		};

		return registry;
	}

	registry.register( coreDataStore );

	for ( const [ name, config ] of Object.entries( storeConfigs ) ) {
		registry.register( createReduxStore( name, config ) );
	}

	if ( parent ) {
		parent.subscribe( globalListener );
	}

	const registryWithPlugins = withPlugins( registry );
	lock( registryWithPlugins, {
		privateActionsOf: ( name ) => {
			try {
				return unlock( stores[ name ].store ).privateActions;
			} catch ( e ) {
				// unlock() throws an error the store was not locked – this means
				// there no private actions are available
				return {};
			}
		},
		privateSelectorsOf: ( name ) => {
			try {
				return unlock( stores[ name ].store ).privateSelectors;
			} catch ( e ) {
				return {};
			}
		},
	} );
	return registryWithPlugins;
}
