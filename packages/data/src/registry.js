/**
 * External dependencies
 */
import { mapValues, isObject, forEach } from 'lodash';

/**
 * Internal dependencies
 */
import createReduxStore from './redux-store';
import createCoreDataStore from './store';
import { STORE_NAME } from './store/name';
import { createEmitter } from './utils/emitter';

/** @typedef {import('./types').WPDataStore} WPDataStore */

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
	const __experimentalListeningStores = new Set();

	/**
	 * Global listener called for each store's update.
	 */
	function globalListener() {
		emitter.emit();
	}

	/**
	 * Subscribe to changes to any data.
	 *
	 * @param {Function} listener Listener function.
	 *
	 * @return {Function} Unsubscribe function.
	 */
	const subscribe = ( listener ) => {
		return emitter.subscribe( listener );
	};

	/**
	 * Calls a selector given the current state and extra arguments.
	 *
	 * @param {string|WPDataStore} storeNameOrDefinition Unique namespace identifier for the store
	 *                                                   or the store definition.
	 *
	 * @return {*} The selector's returned value.
	 */
	function select( storeNameOrDefinition ) {
		const storeName = isObject( storeNameOrDefinition )
			? storeNameOrDefinition.name
			: storeNameOrDefinition;
		__experimentalListeningStores.add( storeName );
		const store = stores[ storeName ];
		if ( store ) {
			return store.getSelectors();
		}

		return parent && parent.select( storeName );
	}

	function __experimentalMarkListeningStores( callback, ref ) {
		__experimentalListeningStores.clear();
		const result = callback.call( this );
		ref.current = Array.from( __experimentalListeningStores );
		return result;
	}

	/**
	 * Given the name of a registered store, returns an object containing the store's
	 * selectors pre-bound to state so that you only need to supply additional arguments,
	 * and modified so that they return promises that resolve to their eventual values,
	 * after any resolvers have ran.
	 *
	 * @param {string|WPDataStore} storeNameOrDefinition Unique namespace identifier for the store
	 *                                                   or the store definition.
	 *
	 * @return {Object} Each key of the object matches the name of a selector.
	 */
	function resolveSelect( storeNameOrDefinition ) {
		const storeName = isObject( storeNameOrDefinition )
			? storeNameOrDefinition.name
			: storeNameOrDefinition;
		__experimentalListeningStores.add( storeName );
		const store = stores[ storeName ];
		if ( store ) {
			return store.getResolveSelectors();
		}

		return parent && parent.resolveSelect( storeName );
	}

	/**
	 * Returns the available actions for a part of the state.
	 *
	 * @param {string|WPDataStore} storeNameOrDefinition Unique namespace identifier for the store
	 *                                                   or the store definition.
	 *
	 * @return {*} The action's returned value.
	 */
	function dispatch( storeNameOrDefinition ) {
		const storeName = isObject( storeNameOrDefinition )
			? storeNameOrDefinition.name
			: storeNameOrDefinition;
		const store = stores[ storeName ];
		if ( store ) {
			return store.getActions();
		}

		return parent && parent.dispatch( storeName );
	}

	//
	// Deprecated
	// TODO: Remove this after `use()` is removed.
	//
	function withPlugins( attributes ) {
		return mapValues( attributes, ( attribute, key ) => {
			if ( typeof attribute !== 'function' ) {
				return attribute;
			}
			return function () {
				return registry[ key ].apply( null, arguments );
			};
		} );
	}

	/**
	 * Registers a generic store.
	 *
	 * @param {string} key    Store registry key.
	 * @param {Object} config Configuration (getSelectors, getActions, subscribe).
	 */
	function registerGenericStore( key, config ) {
		if ( typeof config.getSelectors !== 'function' ) {
			throw new TypeError( 'config.getSelectors must be a function' );
		}
		if ( typeof config.getActions !== 'function' ) {
			throw new TypeError( 'config.getActions must be a function' );
		}
		if ( typeof config.subscribe !== 'function' ) {
			throw new TypeError( 'config.subscribe must be a function' );
		}
		// Thi emitter is used to keep track of active listeners when the registry
		// get paused, that way, when resumed we should be able to call all these
		// pending listeners.
		config.emitter = createEmitter();
		const currentSubscribe = config.subscribe;
		config.subscribe = ( listener ) => {
			const unsubscribeFromStoreEmitter = config.emitter.subscribe(
				listener
			);
			const unsubscribeFromRootStore = currentSubscribe( () => {
				if ( config.emitter.isPaused ) {
					config.emitter.emit();
					return;
				}
				listener();
			} );

			return () => {
				if ( unsubscribeFromRootStore ) {
					unsubscribeFromRootStore();
				}
				unsubscribeFromStoreEmitter();
			};
		};
		stores[ key ] = config;
		config.subscribe( globalListener );
	}

	/**
	 * Registers a new store definition.
	 *
	 * @param {WPDataStore} store Store definition.
	 */
	function register( store ) {
		registerGenericStore( store.name, store.instantiate( registry ) );
	}

	/**
	 * Subscribe handler to a store.
	 *
	 * @param {string[]} storeName The store name.
	 * @param {Function} handler   The function subscribed to the store.
	 * @return {Function} A function to unsubscribe the handler.
	 */
	function __experimentalSubscribeStore( storeName, handler ) {
		if ( storeName in stores ) {
			return stores[ storeName ].subscribe( handler );
		}

		// Trying to access a store that hasn't been registered,
		// this is a pattern rarely used but seen in some places.
		// We fallback to regular `subscribe` here for backward-compatibility for now.
		// See https://github.com/WordPress/gutenberg/pull/27466 for more info.
		if ( ! parent ) {
			return subscribe( handler );
		}

		return parent.__experimentalSubscribeStore( storeName, handler );
	}

	function batch( callback ) {
		emitter.pause();
		forEach( stores, ( store ) => store.emitter.pause() );
		callback();
		emitter.resume();
		forEach( stores, ( store ) => store.emitter.resume() );
	}

	let registry = {
		batch,
		registerGenericStore,
		stores,
		namespaces: stores, // TODO: Deprecate/remove this.
		subscribe,
		select,
		resolveSelect,
		dispatch,
		use,
		register,
		__experimentalMarkListeningStores,
		__experimentalSubscribeStore,
	};

	/**
	 * Registers a standard `@wordpress/data` store.
	 *
	 * @param {string} storeName Unique namespace identifier.
	 * @param {Object} options   Store description (reducer, actions, selectors, resolvers).
	 *
	 * @return {Object} Registered store object.
	 */
	registry.registerStore = ( storeName, options ) => {
		if ( ! options.reducer ) {
			throw new TypeError( 'Must specify store reducer' );
		}

		const store = createReduxStore( storeName, options ).instantiate(
			registry
		);
		registerGenericStore( storeName, store );
		return store.store;
	};

	//
	// TODO:
	// This function will be deprecated as soon as it is no longer internally referenced.
	//
	function use( plugin, options ) {
		registry = {
			...registry,
			...plugin( registry, options ),
		};

		return registry;
	}

	registerGenericStore( STORE_NAME, createCoreDataStore( registry ) );

	Object.entries( storeConfigs ).forEach( ( [ name, config ] ) =>
		registry.registerStore( name, config )
	);

	if ( parent ) {
		parent.subscribe( globalListener );
	}

	return withPlugins( registry );
}
