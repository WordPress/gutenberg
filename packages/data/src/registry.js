/**
 * External dependencies
 */
import { createStore } from 'redux';
import { flowRight, without, mapValues, overEvery, get } from 'lodash';

/**
 * Internal dependencies
 */
import dataStore from './store';
import { withRehydration, getPersistenceStorage } from './persist';

/**
 * Returns true if the given argument appears to be a dispatchable action.
 *
 * @param {*} action Object to test.
 *
 * @return {boolean} Whether object is action-like.
 */
export function isActionLike( action ) {
	return (
		!! action &&
		typeof action.type === 'string'
	);
}

/**
 * Returns true if the given object is an async iterable, or false otherwise.
 *
 * @param {*} object Object to test.
 *
 * @return {boolean} Whether object is an async iterable.
 */
export function isAsyncIterable( object ) {
	return (
		!! object &&
		typeof object[ Symbol.asyncIterator ] === 'function'
	);
}

/**
 * Returns true if the given object is iterable, or false otherwise.
 *
 * @param {*} object Object to test.
 *
 * @return {boolean} Whether object is iterable.
 */
export function isIterable( object ) {
	return (
		!! object &&
		typeof object[ Symbol.iterator ] === 'function'
	);
}

/**
 * Normalizes the given object argument to an async iterable, asynchronously
 * yielding on a singular or array of generator yields or promise resolution.
 *
 * @param {*} object Object to normalize.
 *
 * @return {AsyncGenerator} Async iterable actions.
 */
export function toAsyncIterable( object ) {
	if ( isAsyncIterable( object ) ) {
		return object;
	}

	return ( async function* () {
		// Normalize as iterable...
		if ( ! isIterable( object ) ) {
			object = [ object ];
		}

		for ( let maybeAction of object ) {
			// ...of Promises.
			if ( ! ( maybeAction instanceof Promise ) ) {
				maybeAction = Promise.resolve( maybeAction );
			}

			yield await maybeAction;
		}
	}() );
}

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
	 * @param {string}  reducerKey  Reducer key.
	 * @param {Object}  reducer     Reducer function.
	 * @param {boolean} persist     Should the reducer be persisted.
	 *
	 * @return {Object} Store Object.
	 */
	function registerReducer( reducerKey, reducer, persist = false ) {
		const enhancers = [];
		if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
			enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__( { name: reducerKey, instanceId: reducerKey } ) );
		}
		reducer = persist ? withRehydration( reducer ) : reducer;
		const store = createStore( reducer, flowRight( enhancers ) );
		namespaces[ reducerKey ] = { store, reducer, persist };

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

			// Normalize resolver shape to object.
			let resolver = newResolvers[ selectorName ];
			if ( ! resolver.fulfill ) {
				resolver = { fulfill: resolver };
			}

			async function fulfill( ...args ) {
				if ( hasStartedResolution( reducerKey, selectorName, args ) ) {
					return;
				}

				startResolution( reducerKey, selectorName, args );

				// At this point, selectors have already been pre-bound to inject
				// state, it would not be otherwise provided to fulfill.
				const state = store.getState();

				let fulfillment = resolver.fulfill( state, ...args );

				// Attempt to normalize fulfillment as async iterable.
				fulfillment = toAsyncIterable( fulfillment );
				if ( ! isAsyncIterable( fulfillment ) ) {
					return;
				}

				for await ( const maybeAction of fulfillment ) {
				// Dispatch if it quacks like an action.
					if ( isActionLike( maybeAction ) ) {
						store.dispatch( maybeAction );
					}
				}

				finishResolution( reducerKey, selectorName, args );
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

		const store = registerReducer( reducerKey, options.reducer, options.persist );

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

	/**
	 * Setup persistence for the current registry.
	 *
	 * @param {string} storageKey The storage key.
	 */
	function setupPersistence( storageKey ) {
		const persistenceStorage = getPersistenceStorage();

		// Load initially persisted value
		let previousValue = null;
		const persistedString = persistenceStorage.getItem( storageKey );
		if ( persistedString ) {
			const persistedData = JSON.parse( persistedString );
			Object.entries( namespaces ).forEach( ( [ reducerKey, { reducer, store, persist } ] ) => {
				if ( ! persist ) {
					return;
				}

				const persistedState = {
					...reducer( undefined, { type: '@@gutenberg/init' } ),
					...get( persistedData, reducerKey ),
				};

				store.dispatch( {
					type: 'REDUX_REHYDRATE',
					payload: persistedState,
				} );
			} );

			// Avoid initial save.
			previousValue = persistedData;
		}

		// Persist updated preferences
		subscribe( () => {
			const newValue = Object.entries( namespaces )
				.filter( ( [ , { persist } ] ) => persist )
				.reduce( ( memo, [ reducerKey, { reducer, store } ] ) => {
					memo[ reducerKey ] = reducer( store.getState(), { type: 'SERIALIZE' } );
					return memo;
				}, {} );

			if ( newValue !== previousValue ) {
				persistenceStorage.setItem( storageKey, JSON.stringify( newValue ) );
				previousValue = newValue;
			}
		} );
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
		setupPersistence,
	};
}
