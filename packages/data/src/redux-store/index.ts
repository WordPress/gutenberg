/**
 * External dependencies
 */
import { Store as ReduxNativeStore, createStore, applyMiddleware } from 'redux';
import { flowRight, get, mapValues, omit } from 'lodash';
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
import createThunkMiddleware from './thunk-middleware';
import metadataReducer from './metadata/reducer';
import * as metadataSelectors from './metadata/selectors';
import * as metadataActions from './metadata/actions';

import type {
	AdvancedResolver,
	GenConfig,
	Of,
	RSCActions,
	RSCName,
	RSCSelectors,
	RSCState,
	RSCResolvers,
	StoreDefinition,
} from '../types';

interface ResolverCache< Config extends GenConfig > {
	isRunning(
		selectorName: keyof RSCSelectors< Config >,
		args: unknown[]
	): boolean;
	clear( selectorName: keyof RSCSelectors< Config >, args: unknown[] ): void;
	markAsRunning(
		selectorName: keyof RSCSelectors< Config >,
		args: unknown[]
	): void;
}

interface ReduxStore< Config extends GenConfig >
	extends Omit<
		ReduxNativeStore< {
			metadata: Of< unknown >;
			root: RSCState< Config >;
		} >,
		'dispatch' | 'getState'
	> {
	__unstableOriginalGetState(): {
		metadata: Of< unknown >;
		root: RSCState< Config >;
	};
	dispatch< Action extends keyof RSCActions< Config > >(
		action: RSCActions< Config >[ Action ]
	): unknown;
	getActions(): RSCActions< Config >;
	getResolveSelectors(): RSCResolvers< Config >;
	getSelectors(): RSCSelectors< Config >;
	getState(): RSCState< Config >;
}

/**
 * Create a cache to track whether resolvers started running or not.
 *
 * @return Resolvers Cache.
 */
function createResolversCache() {
	const cache: Record< string, EquivalentKeyMap< unknown[], boolean > > = {};
	return {
		isRunning( selectorName: string, args: unknown[] ) {
			return !! (
				cache[ selectorName ] && cache[ selectorName ].get( args )
			);
		},

		clear( selectorName: string, args: unknown[] ) {
			if ( cache[ selectorName ] ) {
				cache[ selectorName ].delete( args );
			}
		},

		markAsRunning( selectorName: string, args: unknown[] ) {
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
 * @param  key     Unique namespace identifier.
 * @param  options Registered store options, with properties
 *                 describing reducer, actions, selectors,
 *                 and resolvers.
 *
 * @return Store  Object.
 */
export default function createReduxStore< Config extends GenConfig >(
	key: RSCName< Config >,
	options: Config
): StoreDefinition< Config > {
	return {
		name: key,
		instantiate: ( registry ) => {
			const reducer = options.reducer;
			const thunkArgs = {
				registry,
				get dispatch() {
					return Object.assign(
						< Action extends keyof RSCActions< Config > >(
							action: RSCActions< Config >[ Action ]
						) => store.dispatch( action ),
						getActions()
					);
				},
				get select() {
					return Object.assign(
						< SelectorName extends keyof RSCSelectors< Config > >(
							selector: RSCSelectors< Config >[ SelectorName ]
						) => selector( store.__unstableOriginalGetState() ),
						getSelectors()
					);
				},
				get resolveSelect() {
					return getResolveSelectors();
				},
			};

			const store = ( instantiateReduxStore(
				key,
				options,
				registry,
				thunkArgs
			) as unknown ) as ReduxStore< Config >;
			const resolversCache = createResolversCache();

			let resolvers;
			const actions = mapActions(
				{
					...metadataActions,
					...options.actions,
				},
				store
			);

			let selectors = mapSelectors(
				{
					...mapValues(
						metadataSelectors,
						( selector ) => (
							state: RSCState< Config >,
							...args: Parameters< typeof selector >
						) => selector( state.metadata, ...args )
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
			if ( options.resolvers ) {
				const result = mapResolvers(
					options.resolvers,
					selectors,
					store,
					resolversCache
				);
				resolvers = result.resolvers;
				selectors = result.selectors;
			}

			const resolveSelectors = mapResolveSelectors( selectors, store );

			const getSelectors = () => selectors;
			const getActions = () => actions;
			const getResolveSelectors = () => resolveSelectors;

			// We have some modules monkey-patching the store object
			// It's wrong to do so but until we refactor all of our effects to controls
			// We need to keep the same "store" instance here.
			store.__unstableOriginalGetState = ( ( store as unknown ) as ReduxNativeStore< {
				root: RSCState< Config >;
			} > ).getState;
			store.getState = () => store.__unstableOriginalGetState().root;

			// Customize subscribe behavior to call listeners only on effective change,
			// not on every dispatch.
			const subscribe =
				store &&
				( ( listener: () => void ) => {
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
				getActions,
				subscribe,
			};
		},
	};
}

/**
 * Creates a redux store for a namespace.
 *
 * @param  key       Unique namespace identifier.
 * @param  options   Registered store options, with properties
 *                   describing reducer, actions, selectors,
 *                   and resolvers.
 * @param  registry  Registry reference.
 * @param  thunkArgs Argument object for the thunk middleware.
 * @return Newly created redux store.
 */
function instantiateReduxStore< Config extends GenConfig >(
	key: string,
	options: Config,
	registry: unknown,
	thunkArgs: unknown
) {
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

	if ( options.__experimentalUseThunks ) {
		middlewares.push( createThunkMiddleware( thunkArgs ) );
	}

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
 * Maps selectors to a store.
 *
 * @param  selectors Selectors to register. Keys will be used as the
 *                   public facing API. Selectors will get passed the
 *                   state as first argument.
 * @param  store     The store to which the selectors should be mapped.
 * @return  electors mapped to the provided store.
 */
function mapSelectors< Config extends GenConfig >(
	selectors: RSCSelectors< Config >,
	store: ReduxStore< Config >
) {
	const createStateSelector = <
		SelectorName extends keyof RSCSelectors< Config >
	>(
		registrySelector: RSCSelectors< Config >[ SelectorName ]
	) => {
		const selector = function runSelector() {
			// This function is an optimized implementation of:
			//
			//   selector( store.getState(), ...arguments )
			//
			// Where the above would incur an `Array#concat` in its application,
			// the logic here instead efficiently constructs an arguments array via
			// direct assignment.
			const argsLength = arguments.length;
			const args = new Array( argsLength + 1 );
			args[ 0 ] = store.__unstableOriginalGetState();
			for ( let i = 0; i < argsLength; i++ ) {
				args[ i + 1 ] = arguments[ i ];
			}

			return registrySelector( ...args );
		};
		selector.hasResolver = false;
		return selector;
	};

	return mapValues( selectors, createStateSelector );
}

/**
 * Maps actions to dispatch from a given store.
 *
 * @param  actions Actions to register.
 * @param  store   The redux store to which the actions should be mapped.
 *
 * @return Actions mapped to the redux store provided.
 */
function mapActions< Config extends GenConfig >(
	actions: RSCActions< Config >,
	store: ReduxStore< Config >
) {
	const createBoundAction = < ActionName extends keyof RSCActions< Config > >(
		action: RSCActions< Config >[ ActionName ]
	) => ( ...args: Parameters< RSCActions< Config >[ ActionName ] > ) => {
		return Promise.resolve( store.dispatch( action( ...args ) ) );
	};

	return mapValues( actions, createBoundAction );
}

/**
 * Maps selectors to functions that return a resolution promise for them
 *
 * @param  selectors Selectors to map.
 * @param  store     The redux store the selectors select from.
 *
 * @return  Selectors mapped to their resolution functions.
 */
function mapResolveSelectors< Config extends GenConfig >(
	selectors: RSCSelectors< Config >,
	store: ReduxStore< Config >
) {
	return mapValues(
		omit( selectors, [
			'getIsResolving',
			'hasStartedResolution',
			'hasFinishedResolution',
			'isResolving',
			'getCachedResolvers',
		] ),
		( selector, selectorName ) => ( ...args ) =>
			new Promise( ( resolve ) => {
				const hasFinished = () =>
					selectors.hasFinishedResolution( selectorName, args );
				const getResult = () => selector.apply( null, args );

				// trigger the selector (to trigger the resolver)
				const result = getResult();
				if ( hasFinished() ) {
					return resolve( result );
				}

				const unsubscribe = store.subscribe( () => {
					if ( hasFinished() ) {
						unsubscribe();
						resolve( getResult() );
					}
				} );
			} )
	);
}

/**
 * Returns resolvers with matched selectors for a given namespace.
 * Resolvers are side effects invoked once per argument set of a given selector call,
 * used in ensuring that the data needs for the selector are satisfied.
 *
 * @param  resolvers      Resolvers to register.
 * @param  selectors      The current selectors to be modified.
 * @param  store          The redux store to which the resolvers should be mapped.
 * @param  resolversCache Resolvers Cache.
 */
function mapResolvers< Config extends GenConfig >(
	resolvers: RSCResolvers< Config >,
	selectors: RSCSelectors< Config >,
	store: ReduxStore< Config >,
	resolversCache: ResolverCache< Config >
) {
	// The `resolver` can be either a function that does the resolution, or, in more advanced
	// cases, an object with a `fullfill` method and other optional methods like `isFulfilled`.
	// Here we normalize the `resolver` function to an object with `fulfill` method.
	const mappedResolvers = mapValues( resolvers, ( resolver ) => {
		if ( ( resolver as AdvancedResolver ).fulfill ) {
			return resolver;
		}

		return {
			...resolver, // copy the enumerable properties of the resolver function
			fulfill: resolver, // add the fulfill method
		};
	} );

	const mapSelector = <
		SelectorName extends keyof RSCSelectors< Config > & string
	>(
		selector: RSCSelectors< Config >[ SelectorName ],
		selectorName: SelectorName
	) => {
		const resolver = resolvers[ selectorName ];
		if ( ! resolver ) {
			selector.hasResolver = false;
			return selector;
		}

		const selectorResolver = (
			...args: Parameters< RSCSelectors< Config >[ SelectorName ] >
		): ReturnType< RSCSelectors< Config >[ SelectorName ] > => {
			async function fulfillSelector() {
				const state = store.getState();
				const isFulfilled =
					'isFulfilled' in resolver && resolver.isFulfilled;

				if (
					resolversCache.isRunning( selectorName, args ) ||
					( typeof isFulfilled === 'function' &&
						isFulfilled( state, ...args ) )
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
					await fulfillResolver(
						store,
						mappedResolvers,
						selectorName,
						...args
					);
					store.dispatch(
						metadataActions.finishResolution( selectorName, args )
					);
				} );
			}

			fulfillSelector();
			return selector( ...args );
		};
		selectorResolver.hasResolver = true;
		return selectorResolver;
	};

	return {
		resolvers: mappedResolvers,
		selectors: mapValues( selectors, mapSelector ),
	};
}

/**
 * Calls a resolver given arguments
 *
 * @param  store        Store reference, for fulfilling via resolvers
 * @param  resolvers    Store Resolvers
 * @param  selectorName Selector name to fulfill.
 * @param  args         Selector Arguments.
 */
async function fulfillResolver< Config extends GenConfig >(
	store: ReduxStore< Config >,
	resolvers: RSCResolvers< Config >,
	selectorName: keyof RSCActions< Config >,
	...args: unknown[]
) {
	const resolver = get( resolvers, [ selectorName ] );
	if ( ! resolver ) {
		return;
	}

	const action = resolver.fulfill( ...args );
	if ( action ) {
		await store.dispatch( action );
	}
}
