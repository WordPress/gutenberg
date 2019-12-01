/**
 * External dependencies
 */
import {
	omit,
	without,
	mapValues,
} from 'lodash';
import memize from 'memize';

/**
 * Internal dependencies
 */
import createNamespace from './namespace-store';
import createCoreDataStore from './store';
import { useSelect } from '.';

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
		const store = stores[ reducerKey ];
		if ( store ) {
			return store.getSelectors();
		}

		return parent && parent.select( reducerKey );
	}

	const getResolveSelectors = memize(
		( selectors ) => {
			return mapValues(
				omit(
					selectors,
					[
						'getIsResolving',
						'hasStartedResolution',
						'hasFinishedResolution',
						'isResolving',
						'getCachedResolvers',
					]
				),
				( selector, selectorName ) => {
					const resolveSelector = ( ...args ) => {
						return new Promise( ( resolve ) => {
							const hasFinished = () => selectors
								.hasFinishedResolution( selectorName, args );
							const getResult = () => selector.apply( null, args );

							// Trigger the resolver.
							const result = getResult();
							if (
								hasFinished() ||
								// If it hasn't started, that means it has no resolver.
								! selectors.hasStartedResolution( selectorName, args )
							) {
								return resolve( result );
							}

							const unsubscribe = subscribe( () => {
								if ( hasFinished() ) {
									unsubscribe();
									resolve( getResult() );
								}
							} );
						} );
					};
					resolveSelector.selector = selector;
					return resolveSelector;
				}
			);
		},
		{ maxSize: 1 }
	);

	/**
  * Given the name of a registered store, returns an object containing the store's
  * selectors pre-bound to state so that you only need to supply additional arguments,
  * and modified so that they return promises that resolve to their eventual values,
  * after any resolvers have ran.
  *
  * @param {string} reducerKey Part of the state shape to register the
  *                            selectors for.
  *
  * @return {Object} Each key of the object matches the name of a selector.
  */
	function __experimentalResolveSelect( reducerKey ) {
		return getResolveSelectors( select( reducerKey ) );
	}

	const getReadSelectors = memize(
		( resolveSelectors ) =>
			mapValues( resolveSelectors, ( resolveSelector ) => ( ...args ) => {
				let status = 'pending';
				let result;
				const suspender = resolveSelector( ...args ).then(
					( value ) => {
						status = 'success';
						result = value;
					},
					( error ) => {
						status = 'error';
						result = error;
					}
				);
				return {
					read() {
						switch ( status ) {
							case 'pending':
								throw suspender;
							case 'success':
								return resolveSelector.selector( ...args );
							case 'error':
								throw result;
						}
					},
					useRead() {
						return useSelect( () => resolveSelector.selector( ...args ), [] );
					},
				};
			} ),
		{ maxSize: 1 }
	);

	/**
  * Given a reducer key, returns an object containing the reducer's
  * selectors as Suspense compatible resource creators.
  *
  * When a resource creator is called, the arguments are forwarded to the relevant
  * selector and an object with a `read` and a `useRead` method is returned.
  *
  * `read` attempts to read the selector's resolved value, but suspends up to the
  * nearest Suspense boundary if its resolver is still running. It will also throw
  * any errors in the selector or resolver.
  *
  * `useRead` is a hook that calls and subscribes to the selector. It's useful when you
  * expect a selector's value to change and you want a component tree to rerender
  * when it does so that `.read` calls run again.
  *
  * @see https://reactjs.org/docs/concurrent-mode-suspense.html
  *
  * @param {string} reducerKey Reducer key.
  *
  * @return {Object} Object containing the reducer's Suspense selector resource creators.
  */
	function __experimentalReadSelect( reducerKey ) {
		return getReadSelectors( __experimentalResolveSelect( reducerKey ) );
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
		__experimentalResolveSelect,
		__experimentalReadSelect,
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
