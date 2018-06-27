/**
 * External dependencies
 */
import { createStore } from 'redux';
import { flowRight, without, mapValues, overEvery, get } from 'lodash';
import createStoreRuntime from './runtime';

/**
 * Internal dependencies
 */
import dataStore from './store';

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
	 * Registers a new sub-reducer to the global state and returns a Redux-like store object.
	 *
	 * @param {string} reducerKey Reducer key.
	 * @param {Object} reducer    Reducer function.
	 *
	 * @return {Object} Store Object.
	 */
	function registerReducer( reducerKey, reducer ) {
		const enhancers = [];
		if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
			enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__( { name: reducerKey, instanceId: reducerKey } ) );
		}
		const store = createStore( reducer, flowRight( enhancers ) );
		namespaces[ reducerKey ] = {
			runtime: createStoreRuntime( store ),
			store,
		};

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
		const { hasStartedResolution } = select( 'core/data' );
		const { startResolution, finishResolution } = dispatch( 'core/data' );

		const createResolver = ( selector, selectorName ) => {
		// Don't modify selector behavior if no resolver exists.
			if ( ! newResolvers.hasOwnProperty( selectorName ) ) {
				return selector;
			}

			const store = namespaces[ reducerKey ].store;
			const runtime = namespaces[ reducerKey ].runtime;

			// Normalize resolver shape to object.
			let resolver = newResolvers[ selectorName ];
			if ( ! resolver.fulfill ) {
				resolver = { fulfill: resolver };
			}

			function fulfill( ...args ) {
				if ( hasStartedResolution( reducerKey, selectorName, args ) ) {
					return;
				}

				startResolution( reducerKey, selectorName, args );

				// At this point, selectors have already been pre-bound to inject
				// state, it would not be otherwise provided to fulfill.
				const state = store.getState();

				const fulfillment = resolver.fulfill( state, ...args );
				runtime( fulfillment, () => {
					finishResolution( reducerKey, selectorName, args );
				} );
			}

			if ( typeof resolver.isFulfilled === 'function' ) {
				// When resolver provides its own fulfillment condition, fulfill
				// should only occur if not already fulfilled (opt-out condition).
				fulfill = overEvery( [
					( ...args ) => {
						const state = store.getState();
						return ! resolver.isFulfilled( state, ...args );
					},
					fulfill,
				] );
			}

			return ( ...args ) => {
				fulfill( ...args );
				return selector( ...args );
			};
		};

		namespaces[ reducerKey ].selectors = mapValues( namespaces[ reducerKey ].selectors, createResolver );
	}

	/**
	 * Registers actions for external usage.
	 *
	 * @param {string} reducerKey   Part of the state shape to register the
	 *                              selectors for.
	 * @param {Object} newActions   Actions to register.
	 */
	function registerActions( reducerKey, newActions ) {
		const runtime = namespaces[ reducerKey ].runtime;
		const createBoundAction = ( action ) => ( ...args ) => runtime( action( ...args ) );
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

	Object.entries( {
		'core/data': dataStore,
		...storeConfigs,
	} ).map( ( [ name, config ] ) => registerStore( name, config ) );

	return {
		registerReducer,
		registerSelectors,
		registerResolvers,
		registerActions,
		registerStore,
		subscribe,
		select,
		dispatch,
	};
}
