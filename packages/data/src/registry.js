/**
 * External dependencies
 */
import { createStore, applyMiddleware } from 'redux';
import {
	flowRight,
	without,
	mapValues,
	get,
} from 'lodash';

/**
 * Internal dependencies
 */
import dataStore from './store';
import promise from './promise-middleware';

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
	 * Registers a new sub-reducer to the global state and returns a Redux-like
	 * store object.
	 *
	 * @param {string} reducerKey Reducer key.
	 * @param {Object} reducer    Reducer function.
	 *
	 * @return {Object} Store Object.
	 */
	function registerReducer( reducerKey, reducer ) {
		const enhancers = [
			applyMiddleware( promise ),
		];
		if ( typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__ ) {
			enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__( { name: reducerKey, instanceId: reducerKey } ) );
		}
		const store = createStore( reducer, flowRight( enhancers ) );
		namespaces[ reducerKey ] = { store, reducer };

		// Customize subscribe behavior to call listeners only on effective change,
		// not on every dispatch.
		let lastState = store.getState();
		store.subscribe( () => {
			const state = store.getState();
			const hasChanged = state !== lastState;
			lastState = state;

			if ( hasChanged ) {
				globalListener();
			}
		} );

		return store;
	}

	/**
	 * Registers selectors for external usage.
	 *
	 * @param {string} reducerKey   Part of the state shape to register the
	 *                              selectors for.
	 * @param {Object} newSelectors Selectors to register. Keys will be used as the
	 *                              public facing API. Selectors will get passed the
	 *                              state as first argument.
	 */
	function registerSelectors( reducerKey, newSelectors ) {
		const store = namespaces[ reducerKey ].store;
		const createStateSelector = ( selector ) => ( ...args ) => selector( store.getState(), ...args );
		namespaces[ reducerKey ].selectors = mapValues( newSelectors, createStateSelector );
	}

	/**
	 * Registers resolvers for a given reducer key. Resolvers are side effects
	 * invoked once per argument set of a given selector call, used in ensuring
	 * that the data needs for the selector are satisfied.
	 *
	 * @param {string} reducerKey   Part of the state shape to register the
	 *                              resolvers for.
	 * @param {Object} newResolvers Resolvers to register.
	 */
	function registerResolvers( reducerKey, newResolvers ) {
		namespaces[ reducerKey ].resolvers = mapValues( newResolvers, ( resolver ) => {
			if ( ! resolver.fulfill ) {
				resolver = { fulfill: resolver };
			}

			return resolver;
		} );

		namespaces[ reducerKey ].selectors = mapValues( namespaces[ reducerKey ].selectors, ( selector, selectorName ) => {
			const resolver = newResolvers[ selectorName ];
			if ( ! resolver ) {
				return selector;
			}

			return ( ...args ) => {
				const { hasStartedResolution } = select( 'core/data' );
				const { startResolution, finishResolution } = dispatch( 'core/data' );
				async function fulfillSelector() {
					const state = namespaces[ reducerKey ].store.getState();
					if ( typeof resolver.isFulfilled === 'function' && resolver.isFulfilled( state, ...args ) ) {
						return;
					}

					if ( hasStartedResolution( reducerKey, selectorName, args ) ) {
						return;
					}

					startResolution( reducerKey, selectorName, args );
					await registry.__experimentalFulfill( reducerKey, selectorName, ...args );
					finishResolution( reducerKey, selectorName, args );
				}

				fulfillSelector( ...args );
				return selector( ...args );
			};
		} );
	}

	/**
	 * Registers actions for external usage.
	 *
	 * @param {string} reducerKey   Part of the state shape to register the
	 *                              selectors for.
	 * @param {Object} newActions   Actions to register.
	 */
	function registerActions( reducerKey, newActions ) {
		const store = namespaces[ reducerKey ].store;
		const createBoundAction = ( action ) => ( ...args ) => store.dispatch( action( ...args ) );
		namespaces[ reducerKey ].actions = mapValues( newActions, createBoundAction );
	}

	/**
	 * Convenience for registering reducer with actions and selectors.
	 *
	 * @param {string} reducerKey Reducer key.
	 * @param {Object} options    Store description (reducer, actions, selectors, resolvers).
	 *
	 * @return {Object} Registered store object.
	 */
	function registerStore( reducerKey, options ) {
		if ( ! options.reducer ) {
			throw new TypeError( 'Must specify store reducer' );
		}

		const store = registerReducer( reducerKey, options.reducer );

		if ( options.actions ) {
			registerActions( reducerKey, options.actions );
		}

		if ( options.selectors ) {
			registerSelectors( reducerKey, options.selectors );
		}

		if ( options.resolvers ) {
			registerResolvers( reducerKey, options.resolvers );
		}

		return store;
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
	 * Calls a resolver given  arguments
	 *
	 * @param {string} reducerKey   Part of the state shape to register the
	 *                              selectors for.
	 * @param {string} selectorName Selector name to fulfill.
	 * @param {Array} args          Selector Arguments.
	 */
	async function fulfill( reducerKey, selectorName, ...args ) {
		const resolver = get( namespaces, [ reducerKey, 'resolvers', selectorName ] );
		if ( ! resolver ) {
			return;
		}

		const store = namespaces[ reducerKey ].store;
		const actionCreator = resolver.fulfill( ...args );
		if ( actionCreator ) {
			await store.dispatch( actionCreator );
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
		registerReducer,
		registerSelectors,
		registerResolvers,
		registerActions,
		registerStore,
		subscribe,
		select,
		dispatch,
		use,
		__experimentalFulfill: fulfill,
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
	} ).map( ( [ name, config ] ) => registerStore( name, config ) );

	return withPlugins( registry );
}
