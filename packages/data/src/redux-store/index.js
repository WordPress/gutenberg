/**
 * External dependencies
 */
import { createStore, applyMiddleware } from 'redux';
import { flowRight, get, mapValues } from 'lodash';
import combineReducers from 'turbo-combine-reducers';
import EquivalentKeyMap from 'equivalent-key-map';

/**
 * WordPress dependencies
 */
import createReduxRoutineMiddleware from '@wordpress/redux-routine';

/**
 * Internal dependencies
 */
import { builtinControls } from '../controls';
import promise from '../promise-middleware';
import createResolversCacheMiddleware from '../resolvers-cache-middleware';
import metadataReducer from './metadata/reducer';
import * as metadataSelectors from './metadata/selectors';
import * as metadataActions from './metadata/actions';

/** @typedef {import('../types').WPDataRegistry} WPDataRegistry */
/** @typedef {import('../types').WPDataStore} WPDataStore */
/** @typedef {import('../types').WPDataReduxStoreConfig} WPDataReduxStoreConfig */

/**
 * Create a cache to track whether resolvers started running or not.
 *
 * @return {Object} Resolvers Cache.
 */
function createResolversCache() {
	const cache = {};
	return {
		isRunning( selectorName, args ) {
			return cache[ selectorName ] && cache[ selectorName ].get( args );
		},

		clear( selectorName, args ) {
			if ( cache[ selectorName ] ) {
				cache[ selectorName ].delete( args );
			}
		},

		markAsRunning( selectorName, args ) {
			if ( ! cache[ selectorName ] ) {
				cache[ selectorName ] = new EquivalentKeyMap();
			}

			cache[ selectorName ].set( args, true );
		},
	};
}

/**
 * Creates a data store definition for the provided Redux store options containing
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
 * @param {string}                 key      Unique namespace identifier.
 * @param {WPDataReduxStoreConfig} options  Registered store options, with properties
 *                                          describing reducer, actions, selectors,
 *                                          and resolvers.
 *
 * @return {WPDataStore} Store Object.
 */
export default function createReduxStore( key, options ) {
	return {
		name: key,
		instantiate: ( registry ) => {
			const reducer = options.reducer;
			const store = instantiateReduxStore( key, options, registry );
			const resolversCache = createResolversCache();

			const actions = mapActions(
				{
					...metadataActions,
					...options.actions,
				},
				store
			);

			// Inject registry into selectors
			// It is important that this injection happens first because __unstableGetSelect
			// is injected using a mutation of the original selector function.
			const selectorsWithRegistry = mapValues(
				options.selectors,
				( selector ) => {
					if ( selector.isRegistrySelector ) {
						selector.__unstableGetSelect = registry.select;
					}
					return selector;
				}
			);

			// Inject state into selectors
			const injectState = ( getState, selector ) => {
				const mappedSelector = ( ...args ) =>
					selector( getState(), ...args );
				mappedSelector.__unstableRegistrySelector =
					selector.__unstableRegistrySelector;
				return mappedSelector;
			};
			const selectorsWithState = {
				...mapValues( metadataSelectors, ( selector ) =>
					injectState(
						() => store.__unstableOriginalGetState().metadata,
						selector
					)
				),
				...mapValues( selectorsWithRegistry, ( selector ) =>
					injectState(
						() => store.__unstableOriginalGetState().root,
						selector
					)
				),
			};

			// Normalize resolvers
			const resolvers = mapValues( options.resolvers, ( resolver ) => {
				if ( resolver.fulfill ) {
					return resolver;
				}

				return {
					...resolver, // copy the enumerable properties of the resolver function
					fulfill: resolver, // add the fulfill method
				};
			} );

			// Inject resolvers fullfilment call into selectors.
			const selectors = mapValues(
				selectorsWithState,
				( selector, selectorName ) => {
					const resolver = resolvers[ selectorName ];
					if ( ! resolver ) {
						selector.hasResolver = false;
						return selector;
					}

					async function fulfillSelector( args ) {
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
								metadataActions.startResolution(
									selectorName,
									args
								)
							);
							await fulfillResolver(
								store,
								resolvers,
								selectorName,
								...args
							);
							store.dispatch(
								metadataActions.finishResolution(
									selectorName,
									args
								)
							);
						} );
					}

					const mappedSelector = ( ...args ) => {
						fulfillSelector( args );
						return selector( ...args );
					};
					mappedSelector.__unstableRegistrySelector =
						selector.__unstableRegistrySelector;
					mappedSelector.hasResolver = true;

					return mappedSelector;
				}
			);

			const getSelectors = () => selectors;
			const getActions = () => actions;

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
					store.subscribe( () => {
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
				getActions,
				subscribe,
			};
		},
	};
}

/**
 * Creates a redux store for a namespace.
 *
 * @param {string}         key      Unique namespace identifier.
 * @param {Object}         options  Registered store options, with properties
 *                                  describing reducer, actions, selectors,
 *                                  and resolvers.
 * @param {WPDataRegistry} registry Registry reference.
 *
 * @return {Object} Newly created redux store.
 */
function instantiateReduxStore( key, options, registry ) {
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
		flowRight( enhancers )
	);
}

/**
 * Maps actions to dispatch from a given store.
 *
 * @param {Object} actions    Actions to register.
 * @param {Object} store      The redux store to which the actions should be mapped.
 * @return {Object}           Actions mapped to the redux store provided.
 */
function mapActions( actions, store ) {
	const createBoundAction = ( action ) => ( ...args ) => {
		return Promise.resolve( store.dispatch( action( ...args ) ) );
	};

	return mapValues( actions, createBoundAction );
}

/**
 * Calls a resolver given arguments
 *
 * @param {Object} store        Store reference, for fulfilling via resolvers
 * @param {Object} resolvers    Store Resolvers
 * @param {string} selectorName Selector name to fulfill.
 * @param {Array} args          Selector Arguments.
 */
async function fulfillResolver( store, resolvers, selectorName, ...args ) {
	const resolver = get( resolvers, [ selectorName ] );
	if ( ! resolver ) {
		return;
	}

	const action = resolver.fulfill( ...args );
	if ( action ) {
		await store.dispatch( action );
	}
}
