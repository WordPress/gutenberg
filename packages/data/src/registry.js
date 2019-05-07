/**
 * External dependencies
 */
import {
	mapValues,
	castArray,
} from 'lodash';

/**
 * Internal dependencies
 */
import createNamespace from './namespace-store';
import createCoreDataStore from './store';

/**
 * An isolated orchestrator of store registrations.
 *
 * @typedef {WPDataRegistry}
 *
 * @property {Function} registerGenericStore
 * @property {Function} registerStore
 * @property {Function} subscribe
 * @property {Function} select
 * @property {Function} dispatch
 */

/**
 * An object of registry function overrides.
 *
 * @typedef {WPDataPlugin}
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
	const listeners = new Map();

	/**
	 * Global listener called for each store's update.
	 *
	 * @param {string} storeKey
	 */
	function globalListener( storeKey ) {
		// Need to convert Map to array here because iterating through  the Map
		// iterator will pick up any nested subscriptions added DURING iteration.
		// So this captures the snapshot of the contents of the map before
		// iterating.
		const current = Array.from( listeners.entries() );
		for ( const [ dependencies, listener ] of current ) {
			if ( dependencies.length === 0 || dependencies.indexOf( storeKey ) > -1 ) {
				listener();
			}
		}
	}

	/**
	 * Subscribe to changes to any data.
	 *
	 * @param {Function}   listener          Listener function.
	 * @param {Array}      storeDependencies If included, the listener will only
	 *                                       be invoked when a store in this array
	 *                                       has a state change.
	 *
	 * @return {Function}           Unsubscribe function.
	 */
	const subscribe = ( listener, storeDependencies ) => {
		storeDependencies = typeof storeDependencies !== 'undefined' ?
			castArray( storeDependencies ) :
			[];
		listeners.set( storeDependencies, listener );

		return () => {
			listeners.delete( storeDependencies );
		};
	};

	/**
	 * Calls a selector given the current state and extra arguments.
	 *
	 * @param {string} reducerKey Part of the state shape to register the
	 *                            selectors for.
	 *
	 * @return {*} The selector's returned value.
	 */
	function select( reducerKey ) {
		const store = stores[ reducerKey ];
		if ( store ) {
			return store.getSelectors();
		}

		return parent && parent.select( reducerKey );
	}

	/**
	 * Returns the available actions for a part of the state.
	 *
	 * @param {string} reducerKey Part of the state shape to dispatch the
	 *                            action for.
	 *
	 * @return {*} The action's returned value.
	 */
	function dispatch( reducerKey ) {
		const store = stores[ reducerKey ];
		if ( store ) {
			return store.getActions();
		}

		return parent && parent.dispatch( reducerKey );
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
			return function() {
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
		stores[ key ] = config;
		config.subscribe( globalListener );
	}

	let registry = {
		registerGenericStore,
		stores,
		namespaces: stores, // TODO: Deprecate/remove this.
		subscribe,
		select,
		dispatch,
		use,
	};

	/**
	 * Registers a standard `@wordpress/data` store.
	 *
	 * @param {string} reducerKey Reducer key.
	 * @param {Object} options    Store description (reducer, actions, selectors, resolvers).
	 *
	 * @return {Object} Registered store object.
	 */
	registry.registerStore = ( reducerKey, options ) => {
		if ( ! options.reducer ) {
			throw new TypeError( 'Must specify store reducer' );
		}

		const namespace = createNamespace( reducerKey, options, registry );
		registerGenericStore( reducerKey, namespace );
		return namespace.store;
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

	registerGenericStore( 'core/data', createCoreDataStore( registry ) );

	Object.entries( storeConfigs ).forEach(
		( [ name, config ] ) => registry.registerStore( name, config )
	);

	if ( parent ) {
		parent.subscribe( globalListener );
	}

	return withPlugins( registry );
}
