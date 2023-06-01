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
import { lock } from '../private-apis';
import promise from '../promise-middleware';
import createResolversCacheMiddleware from '../resolvers-cache-middleware';
import createThunkMiddleware from './thunk-middleware';
import metadataReducer from './metadata/reducer';
import * as metadataSelectors from './metadata/selectors';
import * as metadataActions from './metadata/actions';

/** @typedef {import('../types').DataRegistry} DataRegistry */
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
			const reducer = options.reducer;
			const thunkArgs = {
				registry,
				get dispatch() {
					return Object.assign(
						( action ) => store.dispatch( action ),
						getActions()
					);
				},
				get select() {
					return Object.assign(
						( selector ) =>
							selector( store.__unstableOriginalGetState() ),
						getSelectors()
					);
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

			lock(
				actions,
				new Proxy( privateActions, {
					get: ( target, prop ) => {
						const privateAction = privateActions[ prop ];
						return privateAction
							? bindAction( privateAction )
							: actions[ prop ];
					},
				} )
			);

			let selectors = mapSelectors(
				{
					...mapValues(
						metadataSelectors,
						( selector ) =>
							( state, ...args ) =>
								selector( state.metadata, ...args )
					),
					...mapValues( options.selectors, ( selector ) => {
						if ( selector.isRegistrySelector ) {
							selector.registry = registry;
						}

						return ( state, ...args ) =>
							selector( state.root, ...args );
					} ),
				},
				store
			);
			lock(
				selectors,
				new Proxy( privateSelectors, {
					get: ( target, prop ) => {
						return (
							mapSelectors(
								mapValues( privateSelectors, ( selector ) => {
									if ( selector.isRegistrySelector ) {
										selector.registry = registry;
									}

									return ( state, ...args ) =>
										selector( state.root, ...args );
								} ),
								store
							)[ prop ] || selectors[ prop ]
						);
					},
				} )
			);

			let resolvers;
			if ( options.resolvers ) {
				resolvers = mapResolvers( options.resolvers );
				selectors = mapSelectorsWithResolvers(
					selectors,
					resolvers,
					store,
					resolversCache
				);
			}

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
					let lastState = store.__unstableOriginalGetState();
					return store.subscribe( () => {
						const state = store.__unstableOriginalGetState();
						const hasChanged = state !== lastState;
						lastState = state;

						if ( hasChanged ) {
							listener();
						}
					} );
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
 * Maps selectors to a store.
 *
 * @param {Object} selectors Selectors to register. Keys will be used as the
 *                           public facing API. Selectors will get passed the
 *                           state as first argument.
 * @param {Object} store     The store to which the selectors should be mapped.
 * @return {Object} Selectors mapped to the provided store.
 */
function mapSelectors( selectors, store ) {
	const createStateSelector = ( registrySelector ) => {
		const selector = ( ...args ) =>
			registrySelector( store.__unstableOriginalGetState(), ...args );
		selector.hasResolver = false;
		return selector;
	};

	return mapValues( selectors, createStateSelector );
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
 * Returns resolvers with matched selectors for a given namespace.
 * Resolvers are side effects invoked once per argument set of a given selector call,
 * used in ensuring that the data needs for the selector are satisfied.
 *
 * @param {Object} selectors      The current selectors to be modified.
 * @param {Object} resolvers      Resolvers to register.
 * @param {Object} store          The redux store to which the resolvers should be mapped.
 * @param {Object} resolversCache Resolvers Cache.
 */
function mapSelectorsWithResolvers(
	selectors,
	resolvers,
	store,
	resolversCache
) {
	function fulfillSelector( resolver, selectorName, args ) {
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

	return mapValues( selectors, ( selector, selectorName ) => {
		const resolver = resolvers[ selectorName ];
		if ( ! resolver ) {
			return selector;
		}

		const selectorResolver = ( ...args ) => {
			fulfillSelector( resolver, selectorName, args );
			return selector( ...args );
		};
		selectorResolver.hasResolver = true;
		return selectorResolver;
	} );
}
