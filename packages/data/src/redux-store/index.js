/**
 * External dependencies
 */
import { createStore, applyMiddleware } from 'redux';
import combineReducers from 'turbo-combine-reducers';
import EquivalentKeyMap from 'equivalent-key-map';

/**
 * WordPress dependencies
 */
import createReduxRoutineMiddleware from '@wordpress/redux-routine';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { builtinControls } from '../controls';
import { lock } from '../lock-unlock';
import promise from '../promise-middleware';
import createResolversCacheMiddleware from '../resolvers-cache-middleware';
import createThunkMiddleware from './thunk-middleware';
import metadataReducer from './metadata/reducer';
import * as metadataSelectors from './metadata/selectors';
import * as metadataActions from './metadata/actions';

/** @typedef {import('../types').DataRegistry} DataRegistry */
/** @typedef {import('../types').ListenerFunction} ListenerFunction */
/**
 * @typedef {import('../types').StoreDescriptor<C>} StoreDescriptor
 * @template {import('../types').AnyConfig} C
 */
/**
 * @typedef {import('../types').ReduxStoreConfig<State,Actions,Selectors>} ReduxStoreConfig
 * @template State
 * @template {Record<string,import('../../types').ActionCreator>} Actions
 * @template Selectors
 */

const trimUndefinedValues = ( array ) => {
	const result = [ ...array ];
	for ( let i = result.length - 1; i >= 0; i-- ) {
		if ( result[ i ] === undefined ) {
			result.splice( i, 1 );
		}
	}
	return result;
};

/**
 * Creates a new object with the same keys, but with `callback()` called as
 * a transformer function on each of the values.
 *
 * @param {Object}   obj      The object to transform.
 * @param {Function} callback The function to transform each object value.
 * @return {Array} Transformed object.
 */
const mapValues = ( obj, callback ) =>
	Object.fromEntries(
		Object.entries( obj ?? {} ).map( ( [ key, value ] ) => [
			key,
			callback( value, key ),
		] )
	);

// Convert Map objects to plain objects
const mapToObject = ( key, state ) => {
	if ( state instanceof Map ) {
		return Object.fromEntries( state );
	}

	return state;
};

/**
 * Create a cache to track whether resolvers started running or not.
 *
 * @return {Object} Resolvers Cache.
 */
function createResolversCache() {
	const cache = {};
	return {
		isRunning( selectorName, args ) {
			return (
				cache[ selectorName ] &&
				cache[ selectorName ].get( trimUndefinedValues( args ) )
			);
		},

		clear( selectorName, args ) {
			if ( cache[ selectorName ] ) {
				cache[ selectorName ].delete( trimUndefinedValues( args ) );
			}
		},

		markAsRunning( selectorName, args ) {
			if ( ! cache[ selectorName ] ) {
				cache[ selectorName ] = new EquivalentKeyMap();
			}

			cache[ selectorName ].set( trimUndefinedValues( args ), true );
		},
	};
}

function createBindingCache( bind ) {
	const cache = new WeakMap();

	return {
		get( item, itemName ) {
			let boundItem = cache.get( item );
			if ( ! boundItem ) {
				boundItem = bind( item, itemName );
				cache.set( item, boundItem );
			}
			return boundItem;
		},
	};
}

/**
 * Creates a data store descriptor for the provided Redux store configuration containing
 * properties describing reducer, actions, selectors, controls and resolvers.
 *
 * @example
 * ```js
 * import { createReduxStore } from '@wordpress/data';
 *
 * const store = createReduxStore( 'demo', {
 *     reducer: ( state = 'OK' ) => state,
 *     selectors: {
 *         getValue: ( state ) => state,
 *     },
 * } );
 * ```
 *
 * @template State
 * @template {Record<string,import('../../types').ActionCreator>} Actions
 * @template Selectors
 * @param {string}                                    key     Unique namespace identifier.
 * @param {ReduxStoreConfig<State,Actions,Selectors>} options Registered store options, with properties
 *                                                            describing reducer, actions, selectors,
 *                                                            and resolvers.
 *
 * @return   {StoreDescriptor<ReduxStoreConfig<State,Actions,Selectors>>} Store Object.
 */
export default function createReduxStore( key, options ) {
	const privateActions = {};
	const privateSelectors = {};
	const privateRegistrationFunctions = {
		privateActions,
		registerPrivateActions: ( actions ) => {
			Object.assign( privateActions, actions );
		},
		privateSelectors,
		registerPrivateSelectors: ( selectors ) => {
			Object.assign( privateSelectors, selectors );
		},
	};
	const storeDescriptor = {
		name: key,
		instantiate: ( registry ) => {
			/**
			 * Stores listener functions registered with `subscribe()`.
			 *
			 * When functions register to listen to store changes with
			 * `subscribe()` they get added here. Although Redux offers
			 * its own `subscribe()` function directly, by wrapping the
			 * subscription in this store instance it's possible to
			 * optimize checking if the state has changed before calling
			 * each listener.
			 *
			 * @type {Set<ListenerFunction>}
			 */
			const listeners = new Set();
			const reducer = options.reducer;
			const thunkArgs = {
				registry,
				get dispatch() {
					return thunkActions;
				},
				get select() {
					return thunkSelectors;
				},
				get resolveSelect() {
					return getResolveSelectors();
				},
			};

			const store = instantiateReduxStore(
				key,
				options,
				registry,
				thunkArgs
			);
			// Expose the private registration functions on the store
			// so they can be copied to a sub registry in registry.js.
			lock( store, privateRegistrationFunctions );
			const resolversCache = createResolversCache();

			function bindAction( action ) {
				return ( ...args ) =>
					Promise.resolve( store.dispatch( action( ...args ) ) );
			}

			const actions = {
				...mapValues( metadataActions, bindAction ),
				...mapValues( options.actions, bindAction ),
			};

			const boundPrivateActions = createBindingCache( bindAction );
			const allActions = new Proxy( () => {}, {
				get: ( target, prop ) => {
					const privateAction = privateActions[ prop ];
					return privateAction
						? boundPrivateActions.get( privateAction, prop )
						: actions[ prop ];
				},
			} );

			const thunkActions = new Proxy( allActions, {
				apply: ( target, thisArg, [ action ] ) =>
					store.dispatch( action ),
			} );

			lock( actions, allActions );

			const resolvers = options.resolvers
				? mapResolvers( options.resolvers )
				: {};

			function bindSelector( selector, selectorName ) {
				if ( selector.isRegistrySelector ) {
					selector.registry = registry;
				}
				const boundSelector = ( ...args ) => {
					const state = store.__unstableOriginalGetState();
					return selector( state.root, ...args );
				};

				const resolver = resolvers[ selectorName ];
				if ( ! resolver ) {
					boundSelector.hasResolver = false;
					return boundSelector;
				}

				return mapSelectorWithResolver(
					boundSelector,
					selectorName,
					resolver,
					store,
					resolversCache
				);
			}

			function bindMetadataSelector( selector ) {
				const boundSelector = ( ...args ) => {
					const state = store.__unstableOriginalGetState();
					return selector( state.metadata, ...args );
				};
				boundSelector.hasResolver = false;
				return boundSelector;
			}

			const selectors = {
				...mapValues( metadataSelectors, bindMetadataSelector ),
				...mapValues( options.selectors, bindSelector ),
			};

			const boundPrivateSelectors = createBindingCache( bindSelector );

			// Pre-bind the private selectors that have been registered by the time of
			// instantiation, so that registry selectors are bound to the registry.
			for ( const [ selectorName, selector ] of Object.entries(
				privateSelectors
			) ) {
				boundPrivateSelectors.get( selector, selectorName );
			}

			const allSelectors = new Proxy( () => {}, {
				get: ( target, prop ) => {
					const privateSelector = privateSelectors[ prop ];
					return privateSelector
						? boundPrivateSelectors.get( privateSelector, prop )
						: selectors[ prop ];
				},
			} );

			const thunkSelectors = new Proxy( allSelectors, {
				apply: ( target, thisArg, [ selector ] ) =>
					selector( store.__unstableOriginalGetState() ),
			} );

			lock( selectors, allSelectors );

			const resolveSelectors = mapResolveSelectors( selectors, store );
			const suspendSelectors = mapSuspendSelectors( selectors, store );

			const getSelectors = () => selectors;
			const getActions = () => actions;
			const getResolveSelectors = () => resolveSelectors;
			const getSuspendSelectors = () => suspendSelectors;

			// We have some modules monkey-patching the store object
			// It's wrong to do so but until we refactor all of our effects to controls
			// We need to keep the same "store" instance here.
			store.__unstableOriginalGetState = store.getState;
			store.getState = () => store.__unstableOriginalGetState().root;

			// Customize subscribe behavior to call listeners only on effective change,
			// not on every dispatch.
			const subscribe =
				store &&
				( ( listener ) => {
					listeners.add( listener );

					return () => listeners.delete( listener );
				} );

			let lastState = store.__unstableOriginalGetState();
			store.subscribe( () => {
				const state = store.__unstableOriginalGetState();
				const hasChanged = state !== lastState;
				lastState = state;

				if ( hasChanged ) {
					for ( const listener of listeners ) {
						listener();
					}
				}
			} );

			// This can be simplified to just { subscribe, getSelectors, getActions }
			// Once we remove the use function.
			return {
				reducer,
				store,
				actions,
				selectors,
				resolvers,
				getSelectors,
				getResolveSelectors,
				getSuspendSelectors,
				getActions,
				subscribe,
			};
		},
	};

	// Expose the private registration functions on the store
	// descriptor. That's a natural choice since that's where the
	// public actions and selectors are stored .
	lock( storeDescriptor, privateRegistrationFunctions );

	return storeDescriptor;
}

/**
 * Creates a redux store for a namespace.
 *
 * @param {string}       key       Unique namespace identifier.
 * @param {Object}       options   Registered store options, with properties
 *                                 describing reducer, actions, selectors,
 *                                 and resolvers.
 * @param {DataRegistry} registry  Registry reference.
 * @param {Object}       thunkArgs Argument object for the thunk middleware.
 * @return {Object} Newly created redux store.
 */
function instantiateReduxStore( key, options, registry, thunkArgs ) {
	const controls = {
		...options.controls,
		...builtinControls,
	};

	const normalizedControls = mapValues( controls, ( control ) =>
		control.isRegistryControl ? control( registry ) : control
	);

	const middlewares = [
		createResolversCacheMiddleware( registry, key ),
		promise,
		createReduxRoutineMiddleware( normalizedControls ),
		createThunkMiddleware( thunkArgs ),
	];

	const enhancers = [ applyMiddleware( ...middlewares ) ];
	if (
		typeof window !== 'undefined' &&
		window.__REDUX_DEVTOOLS_EXTENSION__
	) {
		enhancers.push(
			window.__REDUX_DEVTOOLS_EXTENSION__( {
				name: key,
				instanceId: key,
				serialize: {
					replacer: mapToObject,
				},
			} )
		);
	}

	const { reducer, initialState } = options;
	const enhancedReducer = combineReducers( {
		metadata: metadataReducer,
		root: reducer,
	} );

	return createStore(
		enhancedReducer,
		{ root: initialState },
		compose( enhancers )
	);
}

/**
 * Maps selectors to functions that return a resolution promise for them
 *
 * @param {Object} selectors Selectors to map.
 * @param {Object} store     The redux store the selectors select from.
 *
 * @return {Object} Selectors mapped to their resolution functions.
 */
function mapResolveSelectors( selectors, store ) {
	const {
		getIsResolving,
		hasStartedResolution,
		hasFinishedResolution,
		hasResolutionFailed,
		isResolving,
		getCachedResolvers,
		getResolutionState,
		getResolutionError,
		hasResolvingSelectors,
		...storeSelectors
	} = selectors;

	return mapValues( storeSelectors, ( selector, selectorName ) => {
		// If the selector doesn't have a resolver, just convert the return value
		// (including exceptions) to a Promise, no additional extra behavior is needed.
		if ( ! selector.hasResolver ) {
			return async ( ...args ) => selector.apply( null, args );
		}

		return ( ...args ) => {
			return new Promise( ( resolve, reject ) => {
				const hasFinished = () =>
					selectors.hasFinishedResolution( selectorName, args );
				const finalize = ( result ) => {
					const hasFailed = selectors.hasResolutionFailed(
						selectorName,
						args
					);
					if ( hasFailed ) {
						const error = selectors.getResolutionError(
							selectorName,
							args
						);
						reject( error );
					} else {
						resolve( result );
					}
				};
				const getResult = () => selector.apply( null, args );
				// Trigger the selector (to trigger the resolver)
				const result = getResult();
				if ( hasFinished() ) {
					return finalize( result );
				}

				const unsubscribe = store.subscribe( () => {
					if ( hasFinished() ) {
						unsubscribe();
						finalize( getResult() );
					}
				} );
			} );
		};
	} );
}

/**
 * Maps selectors to functions that throw a suspense promise if not yet resolved.
 *
 * @param {Object} selectors Selectors to map.
 * @param {Object} store     The redux store the selectors select from.
 *
 * @return {Object} Selectors mapped to their suspense functions.
 */
function mapSuspendSelectors( selectors, store ) {
	return mapValues( selectors, ( selector, selectorName ) => {
		// Selector without a resolver doesn't have any extra suspense behavior.
		if ( ! selector.hasResolver ) {
			return selector;
		}

		return ( ...args ) => {
			const result = selector.apply( null, args );

			if ( selectors.hasFinishedResolution( selectorName, args ) ) {
				if ( selectors.hasResolutionFailed( selectorName, args ) ) {
					throw selectors.getResolutionError( selectorName, args );
				}

				return result;
			}

			throw new Promise( ( resolve ) => {
				const unsubscribe = store.subscribe( () => {
					if (
						selectors.hasFinishedResolution( selectorName, args )
					) {
						resolve();
						unsubscribe();
					}
				} );
			} );
		};
	} );
}

/**
 * Convert resolvers to a normalized form, an object with `fulfill` method and
 * optional methods like `isFulfilled`.
 *
 * @param {Object} resolvers Resolver to convert
 */
function mapResolvers( resolvers ) {
	return mapValues( resolvers, ( resolver ) => {
		if ( resolver.fulfill ) {
			return resolver;
		}

		return {
			...resolver, // Copy the enumerable properties of the resolver function.
			fulfill: resolver, // Add the fulfill method.
		};
	} );
}

/**
 * Returns a selector with a matched resolver.
 * Resolvers are side effects invoked once per argument set of a given selector call,
 * used in ensuring that the data needs for the selector are satisfied.
 *
 * @param {Object} selector       The selector function to be bound.
 * @param {string} selectorName   The selector name.
 * @param {Object} resolver       Resolver to call.
 * @param {Object} store          The redux store to which the resolvers should be mapped.
 * @param {Object} resolversCache Resolvers Cache.
 */
function mapSelectorWithResolver(
	selector,
	selectorName,
	resolver,
	store,
	resolversCache
) {
	function fulfillSelector( args ) {
		const state = store.getState();

		if (
			resolversCache.isRunning( selectorName, args ) ||
			( typeof resolver.isFulfilled === 'function' &&
				resolver.isFulfilled( state, ...args ) )
		) {
			return;
		}

		const { metadata } = store.__unstableOriginalGetState();

		if (
			metadataSelectors.hasStartedResolution(
				metadata,
				selectorName,
				args
			)
		) {
			return;
		}

		resolversCache.markAsRunning( selectorName, args );

		setTimeout( async () => {
			resolversCache.clear( selectorName, args );
			store.dispatch(
				metadataActions.startResolution( selectorName, args )
			);
			try {
				const action = resolver.fulfill( ...args );
				if ( action ) {
					await store.dispatch( action );
				}
				store.dispatch(
					metadataActions.finishResolution( selectorName, args )
				);
			} catch ( error ) {
				store.dispatch(
					metadataActions.failResolution( selectorName, args, error )
				);
			}
		}, 0 );
	}

	const selectorResolver = ( ...args ) => {
		fulfillSelector( args );
		return selector( ...args );
	};
	selectorResolver.hasResolver = true;
	return selectorResolver;
}
