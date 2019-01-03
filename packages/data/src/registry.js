/**
 * External dependencies
 */
import {
	castArray,
	without,
	mapValues,
} from 'lodash';

/**
 * Internal dependencies
 */
import createNamespace from './namespace-store.js';
import dataStore from './store';

/**
 * Given an array of functions, invokes each function in the array with an
 * empty argument set.
 *
 * @param {Function[]} fns Functions to invoke.
 */
function invokeForEach( fns ) {
	fns.forEach( ( fn ) => fn() );
}

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
 * @param {Object} storeConfigs Initial store configurations.
 *
 * @return {WPDataRegistry} Data registry.
 */
export function createRegistry( storeConfigs = {} ) {
	const stores = {};
	let globalListeners = [];
	const listenersByKey = {};

	/**
	 * Global listener called for each store's update.
	 *
	 * @param {?string} reducerKey Key of reducer which changed, if provided by
	 *                             the registry implementation.
	 */
	function onStoreChange( reducerKey ) {
		invokeForEach( globalListeners );

		if ( reducerKey ) {
			if ( listenersByKey[ reducerKey ] ) {
				invokeForEach( listenersByKey[ reducerKey ] );
			}
		} else {
			// For backwards compatibility with non-namespace-store, reducerKey
			// is optional. If omitted, call every listenersByKey.
			for ( const [ , listeners ] of Object.entries( listenersByKey ) ) {
				invokeForEach( listeners );
			}
		}
	}

	/**
	 * Subscribe to changes to any data.
	 *
	 * @param {Function}                listener    Listener function.
	 * @param {?(string|Array<string>)} reducerKeys Optional subset of reducer
	 *                                              keys on which subscribe
	 *                                              function should be called.
	 *
	 * @return {Function} Unsubscribe function.
	 */
	const subscribe = ( listener, reducerKeys ) => {
		if ( reducerKeys ) {
			// Overload to support string argument of `reducerKeys`.
			reducerKeys = castArray( reducerKeys );

			reducerKeys.forEach( ( reducerKey ) => {
				if ( ! listenersByKey[ reducerKey ] ) {
					listenersByKey[ reducerKey ] = [];
				}

				listenersByKey[ reducerKey ].push( listener );
			} );

			return () => {
				reducerKeys.forEach( ( reducerKey ) => {
					listenersByKey[ reducerKey ] = without(
						listenersByKey[ reducerKey ],
						listener
					);

					if ( ! listenersByKey[ reducerKey ].length ) {
						delete listenersByKey[ reducerKey ];
					}
				} );
			};
		}

		globalListeners.push( listener );

		return () => {
			globalListeners = without( globalListeners, listener );
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
		return store && store.getSelectors();
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
		return store && store.getActions();
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
		config.subscribe( onStoreChange );
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

	Object.entries( {
		'core/data': dataStore,
		...storeConfigs,
	} ).map( ( [ name, config ] ) => registry.registerStore( name, config ) );

	return withPlugins( registry );
}
