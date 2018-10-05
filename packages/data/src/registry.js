/**
 * External dependencies
 */
import {
	without,
	mapValues,
	get,
} from 'lodash';

/**
 * Internal dependencies
 */
import createNamespace from './namespace-store.js';
import dataStore from './store';

/**
 * An isolated orchestrator of store registrations.
 *
 * @typedef {WPDataRegistry}
 *
 * @property {Function} registerReducer
 * @property {Function} registerSelectors
 * @property {Function} registerResolvers
 * @property {Function} registerActions
 * @property {Function} registerStore
 * @property {Function} subscribe
 * @property {Function} select
 * @property {Function} dispatch
 * @property {Function} use
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
	const namespaces = {};
	let listeners = [];

	/**
	 * Global listener called for each store's update.
	 */
	function globalListener() {
		listeners.forEach( ( listener ) => listener() );
	}

	/**
	 * Subscribe to changes to any data.
	 *
	 * @param {Function}   listener Listener function.
	 *
	 * @return {Function}           Unsubscribe function.
	 */
	const subscribe = ( listener ) => {
		listeners.push( listener );

		return () => {
			listeners = without( listeners, listener );
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
		return get( namespaces, [ reducerKey, 'selectors' ] );
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
		return get( namespaces, [ reducerKey, 'actions' ] );
	}

	/**
	 * Maps an object of function values to proxy invocation through to the
	 * current internal representation of the registry, which may be enhanced
	 * by plugins.
	 *
	 * @param {Object<string,Function>} attributes Object of function values.
	 *
	 * @return {Object<string,Function>} Object enhanced with plugin proxying.
	 */
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

	let registry = {
		namespaces,
		subscribe,
		select,
		dispatch,
		use,
	};

	/**
	 * Registers a new sub-reducer to the global state and returns a Redux-like
	 * store object.
	 *
	 * @param {string} reducerKey Reducer key.
	 * @param {Object} reducer    Reducer function.
	 *
	 * @return {Object} Store Object.
	 */
	registry.registerReducer = ( reducerKey, reducer ) => {
		namespaces[ reducerKey ] = createNamespace( reducerKey, { reducer }, registry, globalListener );
		return namespaces[ reducerKey ].store;
	};

	/**
	 * Registers actions for external usage.
	 *
	 * @param {string} reducerKey   Part of the state shape to register the
	 *                              selectors for.
	 * @param {Object} actions   Actions to register.
	 */
	registry.registerActions = ( reducerKey, actions ) => {
		namespaces[ reducerKey ] = createNamespace( reducerKey, { actions }, registry, globalListener );
	};

	/**
	 * Registers selectors for external usage.
	 *
	 * @param {string} reducerKey   Part of the state shape to register the
	 *                              selectors for.
	 * @param {Object} selectors    Selectors to register. Keys will be used as the
	 *                              public facing API. Selectors will get passed the
	 *                              state as first argument.
	 */
	registry.registerSelectors = ( reducerKey, selectors ) => {
		namespaces[ reducerKey ] = createNamespace( reducerKey, { selectors }, registry, globalListener );
	};

	/**
	 * Registers resolvers for a given reducer key. Resolvers are side effects
	 * invoked once per argument set of a given selector call, used in ensuring
	 * that the data needs for the selector are satisfied.
	 *
	 * @param {string} reducerKey   Part of the state shape to register the
	 *                              resolvers for.
	 * @param {Object} resolvers Resolvers to register.
	 */
	registry.registerResolvers = ( reducerKey, resolvers ) => {
		namespaces[ reducerKey ] = createNamespace( reducerKey, { resolvers }, registry, globalListener );
	};

	/**
	 * Convenience for registering reducer with actions and selectors.
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

		namespaces[ reducerKey ] = createNamespace( reducerKey, options, registry, globalListener );
		return namespaces[ reducerKey ].store;
	};

	/**
	 * Enhances the registry with the prescribed set of overrides. Returns the
	 * enhanced registry to enable plugin chaining.
	 *
	 * @param {WPDataPlugin} plugin  Plugin by which to enhance.
	 * @param {?Object}      options Optional options to pass to plugin.
	 *
	 * @return {WPDataRegistry} Enhanced registry.
	 */
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
