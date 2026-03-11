/**
 * External dependencies
 */
import { createStore, applyMiddleware } from 'redux';
import type { Store as ReduxStore, StoreEnhancer } from 'redux';
import EquivalentKeyMap from 'equivalent-key-map';

/**
 * WordPress dependencies
 */
import createReduxRoutineMiddleware from '@wordpress/redux-routine';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { combineReducers } from './combine-reducers';
import { builtinControls } from '../controls';
import { lock } from '../lock-unlock';
import promise from '../promise-middleware';
import createResolversCacheMiddleware from '../resolvers-cache-middleware';
import createThunkMiddleware from './thunk-middleware';
import metadataReducer from './metadata/reducer';
import * as metadataSelectors from './metadata/selectors';
import * as metadataActions from './metadata/actions';
import type {
	DataRegistry,
	ListenerFunction,
	StoreDescriptor,
	ReduxStoreConfig,
	ActionCreator,
	NormalizedResolver,
} from '../types';

export { combineReducers };

/**
 * Augment the Redux store with internal properties used by the data module.
 */
interface AugmentedReduxStore extends ReduxStore {
	__unstableOriginalGetState: ReduxStore[ 'getState' ];
}

interface ResolversCache {
	isRunning: ( selectorName: string, args: unknown[] ) => boolean;
	clear: ( selectorName: string, args: unknown[] ) => void;
	markAsRunning: ( selectorName: string, args: unknown[] ) => void;
}

interface BindingCache {
	get: ( itemName: string ) => ( ( ...args: unknown[] ) => unknown ) | null;
}

interface SelectorLike {
	( ...args: any[] ): any;
	hasResolver?: boolean;
	isRegistrySelector?: boolean;
	registry?: DataRegistry;
	__unstableNormalizeArgs?: ( args: unknown[] ) => unknown[];
}

const trimUndefinedValues = ( array: unknown[] ): unknown[] => {
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
 * @param obj      The object to transform.
 * @param callback The function to transform each object value.
 * @return Transformed object.
 */
const mapValues = < T, U >(
	obj: Record< string, T > | undefined,
	callback: ( value: T, key: string ) => U
): Record< string, U > =>
	Object.fromEntries(
		Object.entries( obj ?? {} ).map( ( [ key, value ] ) => [
			key,
			callback( value, key ),
		] )
	);

// Convert  non serializable types to plain objects
const devToolsReplacer = ( _key: string, state: unknown ): unknown => {
	if ( state instanceof Map ) {
		return Object.fromEntries( state );
	}

	if (
		typeof window !== 'undefined' &&
		state instanceof window.HTMLElement
	) {
		return null;
	}

	return state;
};

/**
 * Create a cache to track whether resolvers started running or not.
 *
 * @return Resolvers Cache.
 */
function createResolversCache(): ResolversCache {
	const cache: Record< string, EquivalentKeyMap< unknown[], boolean > > = {};
	return {
		isRunning( selectorName: string, args: unknown[] ): boolean {
			return !! (
				cache[ selectorName ] &&
				cache[ selectorName ].get( trimUndefinedValues( args ) )
			);
		},

		clear( selectorName: string, args: unknown[] ): void {
			if ( cache[ selectorName ] ) {
				cache[ selectorName ].delete( trimUndefinedValues( args ) );
			}
		},

		markAsRunning( selectorName: string, args: unknown[] ): void {
			if ( ! cache[ selectorName ] ) {
				cache[ selectorName ] = new EquivalentKeyMap();
			}

			cache[ selectorName ].set( trimUndefinedValues( args ), true );
		},
	};
}

function createBindingCache(
	getItem: ( name: string ) => ( ( ...args: any[] ) => any ) | undefined,
	bindItem: (
		item: ( ...args: any[] ) => any,
		name: string
	) => ( ...args: unknown[] ) => unknown
): BindingCache {
	const cache = new WeakMap<
		( ...args: any[] ) => any,
		( ...args: unknown[] ) => unknown
	>();

	return {
		get( itemName: string ) {
			const item = getItem( itemName );
			if ( ! item ) {
				return null;
			}
			let boundItem = cache.get( item );
			if ( ! boundItem ) {
				boundItem = bindItem( item, itemName );
				cache.set( item, boundItem );
			}
			return boundItem;
		},
	};
}

function createPrivateProxy< T extends Record< string, any > >(
	publicItems: T,
	privateItems: BindingCache
): T {
	return new Proxy( publicItems, {
		get: ( target, itemName: string ) =>
			privateItems.get( itemName ) || Reflect.get( target, itemName ),
	} );
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
 * @param key     Unique namespace identifier.
 * @param options Registered store options, with properties
 *                describing reducer, actions, selectors,
 *                and resolvers.
 *
 * @return Store Object.
 */
export default function createReduxStore< State, Actions, Selectors >(
	key: string,
	options: ReduxStoreConfig< State, Actions, Selectors >
): StoreDescriptor< ReduxStoreConfig< State, Actions, Selectors > > {
	const privateActions: Record< string, ActionCreator > = {};
	const privateSelectors: Record< string, SelectorLike > = {};
	const privateRegistrationFunctions = {
		privateActions,
		registerPrivateActions: (
			actions: Record< string, ActionCreator >
		) => {
			Object.assign( privateActions, actions );
		},
		privateSelectors,
		registerPrivateSelectors: (
			selectors: Record< string, SelectorLike >
		) => {
			Object.assign( privateSelectors, selectors );
		},
	};
	const storeDescriptor = {
		name: key,
		instantiate: ( registry: DataRegistry ) => {
			/**
			 * Stores listener functions registered with `subscribe()`.
			 *
			 * When functions register to listen to store changes with
			 * `subscribe()` they get added here. Although Redux offers
			 * its own `subscribe()` function directly, by wrapping the
			 * subscription in this store instance it's possible to
			 * optimize checking if the state has changed before calling
			 * each listener.
			 */
			const listeners = new Set< ListenerFunction >();
			const reducer = options.reducer;

			// Object that every thunk function receives as the first argument. It contains the
			// `registry`, `dispatch`, `select` and `resolveSelect` fields. Some of them are
			// constructed as getters to avoid circular dependencies.
			const thunkArgs = {
				registry,
				get dispatch() {
					return thunkDispatch;
				},
				get select() {
					return thunkSelect;
				},
				get resolveSelect() {
					return resolveSelectors;
				},
			};

			const store = instantiateReduxStore(
				key,
				options,
				registry,
				thunkArgs
			) as AugmentedReduxStore;

			// Expose the private registration functions on the store
			// so they can be copied to a sub registry in registry.js.
			lock( store, privateRegistrationFunctions );
			const resolversCache = createResolversCache();

			// Binds an action creator (`action`) to the `store`, making it a callable function.
			// These are the functions that are returned by `useDispatch`, for example.
			// It always returns a `Promise`, although actions are not always async. That's an
			// unfortunate backward compatibility measure.
			function bindAction( action: ( ...args: any[] ) => any ) {
				return ( ...args: unknown[] ) =>
					Promise.resolve( store.dispatch( action( ...args ) ) );
			}

			/*
			 * Object with all public actions, both metadata and store actions.
			 */
			const actions = {
				...mapValues(
					metadataActions as Record< string, ActionCreator >,
					bindAction
				),
				...mapValues(
					options.actions as
						| Record< string, ActionCreator >
						| undefined,
					bindAction
				),
			};

			// Object with both public and private actions. Private actions are accessed through a proxy,
			// which looks them up in real time on the `privateActions` object. That's because private
			// actions can be registered at any time with `registerPrivateActions`. Also once a private
			// action creator is bound to the store, it is cached to give it a stable identity.
			const allActions = createPrivateProxy(
				actions,
				createBindingCache(
					( name ) => privateActions[ name ],
					bindAction
				)
			);

			// An object that implements the `dispatch` object that is passed to thunk functions.
			// It is callable (`dispatch( action )`) and also has methods (`dispatch.foo()`) that
			// correspond to bound registered actions, both public and private. Implemented with the proxy
			// `get` method, delegating to `allActions`.
			const thunkDispatch = new Proxy(
				( action: any ) => store.dispatch( action ),
				{
					get: ( _target, name: string ) => allActions[ name ],
				}
			);

			// To the public `actions` object, add the "locked" `allActions` object. When used,
			// `unlock( actions )` will return `allActions`, implementing a way how to get at the private actions.
			lock( actions, allActions );

			// If we have selector resolvers, convert them to a normalized form.
			const resolvers: Record< string, NormalizedResolver > =
				options.resolvers
					? mapValues(
							options.resolvers as Record< string, any >,
							mapResolver
					  )
					: {};

			// Bind a selector to the store. Call the selector with the current state, correct registry,
			// and if there is a resolver, attach the resolver logic to the selector.
			function bindSelector(
				selector: SelectorLike,
				selectorName: string
			): SelectorLike {
				if ( selector.isRegistrySelector ) {
					selector.registry = registry;
				}
				const boundSelector: SelectorLike = ( ...args: any[] ) => {
					args = normalize( selector, args );
					const state = store.__unstableOriginalGetState();
					// Before calling the selector, switch to the correct registry.
					if ( selector.isRegistrySelector ) {
						selector.registry = registry;
					}
					return selector( state.root, ...args );
				};

				// Expose normalization method on the bound selector
				// in order that it can be called when fulfilling
				// the resolver.
				boundSelector.__unstableNormalizeArgs =
					selector.__unstableNormalizeArgs;

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
					resolversCache,
					boundMetadataSelectors
				);
			}

			// Metadata selectors are bound differently: different state (`state.metadata`), no resolvers,
			// normalization depending on the target selector.
			function bindMetadataSelector(
				metaDataSelector: ( ...args: any[] ) => any
			): SelectorLike {
				const boundSelector: SelectorLike = (
					selectorName: string,
					selectorArgs: unknown[],
					...args: unknown[]
				) => {
					// Normalize the arguments passed to the target selector.
					if ( selectorName ) {
						const targetSelector = ( options.selectors as any )?.[
							selectorName
						];
						if ( targetSelector ) {
							selectorArgs = normalize(
								targetSelector,
								selectorArgs
							);
						}
					}

					const state = store.__unstableOriginalGetState();

					return metaDataSelector(
						state.metadata,
						selectorName,
						selectorArgs,
						...args
					);
				};
				boundSelector.hasResolver = false;
				return boundSelector;
			}

			// Perform binding of both metadata and store selectors and combine them in one
			// `selectors` object. These are all public selectors of the store.
			const boundMetadataSelectors = mapValues(
				metadataSelectors as Record<
					string,
					( ...args: any[] ) => any
				>,
				bindMetadataSelector
			);

			const boundSelectors = mapValues(
				options.selectors as Record< string, SelectorLike > | undefined,
				bindSelector
			);

			const selectors = {
				...boundMetadataSelectors,
				...boundSelectors,
			};

			// Cache of bound private selectors. They are bound only when first accessed, because
			// new private selectors can be registered at any time (with `registerPrivateSelectors`).
			// Once bound, they are cached to give them a stable identity.
			const boundPrivateSelectors = createBindingCache(
				( name ) => privateSelectors[ name ],
				bindSelector
			);

			const allSelectors = createPrivateProxy(
				selectors,
				boundPrivateSelectors
			);

			// Pre-bind the private selectors that have been registered by the time of
			// instantiation, so that registry selectors are bound to the registry.
			for ( const selectorName of Object.keys( privateSelectors ) ) {
				boundPrivateSelectors.get( selectorName );
			}

			// An object that implements the `select` object that is passed to thunk functions.
			// It is callable (`select( selector )`) and also has methods (`select.foo()`) that
			// correspond to bound registered selectors, both public and private. Implemented with the proxy
			// `get` method, delegating to `allSelectors`.
			const thunkSelect = new Proxy(
				( selector: ( state: any ) => any ) =>
					selector( store.__unstableOriginalGetState() ),
				{
					get: ( _target, name: string ) => allSelectors[ name ],
				}
			);

			// To the public `selectors` object, add the "locked" `allSelectors` object. When used,
			// `unlock( selectors )` will return `allSelectors`, implementing a way how to get at the private selectors.
			lock( selectors, allSelectors );

			// For each selector, create a function that calls the selector, waits for resolution and returns
			// a promise that resolves when the resolution is finished.
			const bindResolveSelector = mapResolveSelector(
				store,
				boundMetadataSelectors
			);

			// Now apply this function to all bound selectors, public and private. We are excluding
			// metadata selectors because they don't have resolvers.
			const resolveSelectors = mapValues(
				boundSelectors,
				bindResolveSelector
			);

			const allResolveSelectors = createPrivateProxy(
				resolveSelectors,
				createBindingCache(
					( name ) =>
						boundPrivateSelectors.get( name ) as (
							...args: any[]
						) => any | undefined,
					bindResolveSelector
				)
			);

			// Lock the selectors so that `unlock( resolveSelectors )` returns `allResolveSelectors`.
			lock( resolveSelectors, allResolveSelectors );

			// Now, in a way very similar to `bindResolveSelector`, we create a function that maps
			// selectors to functions that throw a suspense promise if not yet resolved.
			const bindSuspendSelector = mapSuspendSelector(
				store,
				boundMetadataSelectors
			);

			const suspendSelectors = {
				...boundMetadataSelectors, // no special suspense behavior
				...mapValues( boundSelectors, bindSuspendSelector ),
			};

			const allSuspendSelectors = createPrivateProxy(
				suspendSelectors,
				createBindingCache(
					( name ) =>
						boundPrivateSelectors.get( name ) as (
							...args: any[]
						) => any | undefined,
					bindSuspendSelector
				)
			);

			// Lock the selectors so that `unlock( suspendSelectors )` returns 'allSuspendSelectors`.
			lock( suspendSelectors, allSuspendSelectors );

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
			const subscribe = ( listener: ListenerFunction ) => {
				listeners.add( listener );

				return () => listeners.delete( listener );
			};

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
	// public actions and selectors are stored.
	lock( storeDescriptor, privateRegistrationFunctions );

	return storeDescriptor as unknown as StoreDescriptor<
		ReduxStoreConfig< State, Actions, Selectors >
	>;
}

/**
 * Creates a redux store for a namespace.
 *
 * @param key       Unique namespace identifier.
 * @param options   Registered store options, with properties
 *                  describing reducer, actions, selectors,
 *                  and resolvers.
 * @param registry  Registry reference.
 * @param thunkArgs Argument object for the thunk middleware.
 * @return Newly created redux store.
 */
function instantiateReduxStore(
	key: string,
	options: ReduxStoreConfig< any, any, any >,
	registry: DataRegistry,
	thunkArgs: unknown
): ReduxStore {
	const controls = {
		...options.controls,
		...builtinControls,
	};

	const normalizedControls = mapValues( controls, ( control: any ) =>
		control.isRegistryControl ? control( registry ) : control
	);

	const middlewares = [
		createResolversCacheMiddleware( registry, key ),
		promise,
		createReduxRoutineMiddleware( normalizedControls ),
		createThunkMiddleware( thunkArgs ),
	];

	const enhancers: StoreEnhancer[] = [ applyMiddleware( ...middlewares ) ];
	if (
		typeof window !== 'undefined' &&
		( window as any ).__REDUX_DEVTOOLS_EXTENSION__
	) {
		enhancers.push(
			( window as any ).__REDUX_DEVTOOLS_EXTENSION__( {
				name: key,
				instanceId: key,
				serialize: {
					replacer: devToolsReplacer,
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
		{ root: initialState } as any,
		compose( ...enhancers ) as unknown as StoreEnhancer
	);
}

/**
 * Maps selectors to functions that return a resolution promise for them.
 *
 * @param store                  The redux store the selectors are bound to.
 * @param boundMetadataSelectors The bound metadata selectors.
 *
 * @return Function that maps selectors to resolvers.
 */
function mapResolveSelector(
	store: ReduxStore,
	boundMetadataSelectors: Record< string, SelectorLike >
) {
	return ( selector: SelectorLike, selectorName: string ) => {
		// If the selector doesn't have a resolver, just convert the return value
		// (including exceptions) to a Promise, no additional extra behavior is needed.
		if ( ! selector.hasResolver ) {
			return async ( ...args: unknown[] ) => selector( ...args );
		}

		return ( ...args: unknown[] ) =>
			new Promise( ( resolve, reject ) => {
				const hasFinished = () => {
					return boundMetadataSelectors.hasFinishedResolution(
						selectorName,
						args
					);
				};
				const finalize = ( result: unknown ) => {
					const hasFailed =
						boundMetadataSelectors.hasResolutionFailed(
							selectorName,
							args
						);
					if ( hasFailed ) {
						const error = boundMetadataSelectors.getResolutionError(
							selectorName,
							args
						);
						reject( error );
					} else {
						resolve( result );
					}
				};
				const getResult = () => selector( ...args );

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
}

/**
 * Maps selectors to functions that throw a suspense promise if not yet resolved.
 *
 * @param store                  The redux store the selectors select from.
 * @param boundMetadataSelectors The bound metadata selectors.
 *
 * @return Function that maps selectors to their suspending versions.
 */
function mapSuspendSelector(
	store: ReduxStore,
	boundMetadataSelectors: Record< string, SelectorLike >
) {
	return ( selector: SelectorLike, selectorName: string ) => {
		// Selector without a resolver doesn't have any extra suspense behavior.
		if ( ! selector.hasResolver ) {
			return selector;
		}

		return ( ...args: unknown[] ) => {
			const result = selector( ...args );

			if (
				boundMetadataSelectors.hasFinishedResolution(
					selectorName,
					args
				)
			) {
				if (
					boundMetadataSelectors.hasResolutionFailed(
						selectorName,
						args
					)
				) {
					throw boundMetadataSelectors.getResolutionError(
						selectorName,
						args
					);
				}

				return result;
			}

			throw new Promise< void >( ( resolve ) => {
				const unsubscribe = store.subscribe( () => {
					if (
						boundMetadataSelectors.hasFinishedResolution(
							selectorName,
							args
						)
					) {
						resolve();
						unsubscribe();
					}
				} );
			} );
		};
	};
}

/**
 * Convert a resolver to a normalized form, an object with `fulfill` method and
 * optional methods like `isFulfilled`.
 *
 * @param resolver Resolver to convert
 */
function mapResolver( resolver: any ): NormalizedResolver {
	if ( resolver.fulfill ) {
		return resolver;
	}

	return {
		...resolver, // Copy the enumerable properties of the resolver function.
		fulfill: resolver, // Add the fulfill method.
	};
}

/**
 * Returns a selector with a matched resolver.
 * Resolvers are side effects invoked once per argument set of a given selector call,
 * used in ensuring that the data needs for the selector are satisfied.
 *
 * @param selector               The selector function to be bound.
 * @param selectorName           The selector name.
 * @param resolver               Resolver to call.
 * @param store                  The redux store to which the resolvers should be mapped.
 * @param resolversCache         Resolvers Cache.
 * @param boundMetadataSelectors The bound metadata selectors.
 */
function mapSelectorWithResolver(
	selector: SelectorLike,
	selectorName: string,
	resolver: NormalizedResolver,
	store: AugmentedReduxStore,
	resolversCache: ResolversCache,
	boundMetadataSelectors: Record< string, SelectorLike >
): SelectorLike {
	function fulfillSelector( args: unknown[] ): void {
		if (
			resolversCache.isRunning( selectorName, args ) ||
			boundMetadataSelectors.hasStartedResolution( selectorName, args )
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
				const isFulfilled =
					typeof resolver.isFulfilled === 'function' &&
					resolver.isFulfilled( store.getState(), ...args );
				if ( ! isFulfilled ) {
					const action = resolver.fulfill( ...args );
					if ( action ) {
						await store.dispatch( action );
					}
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

	const selectorResolver: SelectorLike = ( ...args: unknown[] ) => {
		args = normalize( selector, args );
		fulfillSelector( args );
		return selector( ...args );
	};
	selectorResolver.hasResolver = true;
	return selectorResolver;
}

/**
 * Applies selector's normalization function to the given arguments
 * if it exists.
 *
 * @param selector The selector potentially with a normalization method property.
 * @param args     selector arguments to normalize.
 * @return Potentially normalized arguments.
 */
function normalize( selector: SelectorLike, args: unknown[] ): unknown[] {
	if (
		selector.__unstableNormalizeArgs &&
		typeof selector.__unstableNormalizeArgs === 'function' &&
		args?.length
	) {
		return selector.__unstableNormalizeArgs( args );
	}
	return args;
}
