/**
 * External dependencies
 */
import {
	without,
	mapValues,
	get,
} from 'lodash';
import { applyMiddleware } from 'redux';

/**
 * Internal dependencies
 */
import {
	createNamespace,
	setActions,
	setSelectors,
	setResolvers,
} from './namespace-store.js';
import dataStore from './store';
import promise from './promise-middleware';
import createResolversCacheMiddleware from './resolvers-cache-middleware';

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
	 * Calls a resolver given arguments
	 * TODO: Move this out of the registry and into implementation.
	 *       (after plugins are removed)
	 *
	 * @param {string} reducerKey   Part of the state shape to register the
	 *                              selectors for.
	 * @param {string} selectorName Selector name to fulfill.
	 * @param {Array} args          Selector Arguments.
	 */
	async function fulfill( reducerKey, selectorName, ...args ) {
		const resolver = get( registry.namespaces, [ reducerKey, 'resolvers', selectorName ] );
		if ( ! resolver ) {
			return;
		}

		const store = namespaces[ reducerKey ].store;
		const action = resolver.fulfill( ...args );
		if ( action ) {
			await store.dispatch( action );
		}
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
		const enhancers = [
			applyMiddleware( createResolversCacheMiddleware( registry, reducerKey ), promise ),
		];
		if ( typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__ ) {
			enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__( { name: reducerKey, instanceId: reducerKey } ) );
		}

		// TODO: Remove globalListener from this call after subscriptions are passed.
		namespaces[ reducerKey ] = createNamespace( reducer, enhancers, globalListener );
		return namespaces[ reducerKey ].store;
	};

	/**
	 * Registers actions for external usage.
	 *
	 * @param {string} reducerKey   Part of the state shape to register the
	 *                              selectors for.
	 * @param {Object} newActions   Actions to register.
	 */
	registry.registerActions = ( reducerKey, newActions ) => {
		setActions( namespaces[ reducerKey ], newActions );
	};

	/**
	 * Registers selectors for external usage.
	 *
	 * @param {string} reducerKey   Part of the state shape to register the
	 *                              selectors for.
	 * @param {Object} newSelectors Selectors to register. Keys will be used as the
	 *                              public facing API. Selectors will get passed the
	 *                              state as first argument.
	 */
	registry.registerSelectors = ( reducerKey, newSelectors ) => {
		setSelectors( namespaces[ reducerKey ], newSelectors );
	};

	/**
	 * Registers resolvers for a given reducer key. Resolvers are side effects
	 * invoked once per argument set of a given selector call, used in ensuring
	 * that the data needs for the selector are satisfied.
	 *
	 * @param {string} reducerKey   Part of the state shape to register the
	 *                              resolvers for.
	 * @param {Object} newResolvers Resolvers to register.
	 */
	registry.registerResolvers = ( reducerKey, newResolvers ) => {
		const { hasStartedResolution } = select( 'core/data' );
		const { startResolution, finishResolution } = dispatch( 'core/data' );

		const fulfillment = {
			hasStarted: ( ...args ) => hasStartedResolution( reducerKey, ...args ),
			start: ( ...args ) => startResolution( reducerKey, ...args ),
			finish: ( ...args ) => finishResolution( reducerKey, ...args ),
			fulfill: ( ...args ) => fulfill( reducerKey, ...args ),
		};

		setResolvers( namespaces[ reducerKey ], newResolvers, fulfillment );
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

		const store = registry.registerReducer( reducerKey, options.reducer );

		if ( options.actions ) {
			registry.registerActions( reducerKey, options.actions );
		}

		if ( options.selectors ) {
			registry.registerSelectors( reducerKey, options.selectors );
		}

		if ( options.resolvers ) {
			registry.registerResolvers( reducerKey, options.resolvers );
		}

		return store;
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
