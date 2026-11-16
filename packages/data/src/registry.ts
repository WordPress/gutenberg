import deprecated from '@wordpress/deprecated';
import createReduxStore from './redux-store';
import coreDataStore from './store';
import { createEmitter } from './utils/emitter';
import { lock, unlock } from './lock-unlock';
import type {
	StoreDescriptor,
	StoreNameOrDescriptor,
	DataRegistry,
	DataPlugin,
	InternalStoreInstance,
	AnyConfig,
	ReduxStoreConfig,
} from './types';

function getStoreName( storeNameOrDescriptor: StoreNameOrDescriptor ): string {
	return typeof storeNameOrDescriptor === 'string'
		? storeNameOrDescriptor
		: storeNameOrDescriptor.name;
}

/**
 * A listener subscribed to a store that the registry doesn't have yet. It stays
 * dormant until the store is registered.
 */
interface PendingListener {
	listener: () => void;
	unsubscribe?: () => void;
}

/**
 * Creates a new store registry, given an optional object of initial store
 * configurations.
 *
 * @param storeConfigs Initial store configurations.
 * @param parent       Parent registry.
 *
 * @return Data registry.
 */
export function createRegistry(
	storeConfigs: Record< string, ReduxStoreConfig< any, any, any > > = {},
	parent: DataRegistry | null = null
): DataRegistry {
	const stores: Record< string, InternalStoreInstance > = {};
	const emitter = createEmitter();
	let listeningStores: Set< string > | null = null;
	// Listeners waiting for their store to be registered.
	const pendingListeners = new Map< string, Set< PendingListener > >();

	/**
	 * Global listener called for each store's update.
	 */
	function globalListener() {
		emitter.emit();
	}

	/**
	 * Parks a listener that subscribed to a store that is not registered yet.
	 * `connectPendingListeners` attaches it to the store once it's registered.
	 *
	 * @param storeName Store name.
	 * @param listener  Listener function.
	 *
	 * @return Unsubscribe function.
	 */
	function subscribePending(
		storeName: string,
		listener: () => void
	): () => void {
		const pending: PendingListener = { listener };

		let listeners = pendingListeners.get( storeName );
		if ( ! listeners ) {
			listeners = new Set();
			pendingListeners.set( storeName, listeners );
		}
		listeners.add( pending );

		return () => {
			pending.unsubscribe?.();
			// Remove the listener from the pending set.
			const stillPending = pendingListeners.get( storeName );
			if ( stillPending ) {
				stillPending.delete( pending );
				if ( stillPending.size === 0 ) {
					pendingListeners.delete( storeName );
				}
			}
		};
	}

	/**
	 * Attaches the listeners that subscribed to a store before it existed to the
	 * store that has just been registered.
	 *
	 * @param name  Store name.
	 * @param store The newly registered store.
	 */
	function connectPendingListeners(
		name: string,
		store: InternalStoreInstance
	) {
		const listeners = pendingListeners.get( name );
		if ( ! listeners ) {
			return;
		}

		pendingListeners.delete( name );
		for ( const pending of listeners ) {
			pending.unsubscribe = store.subscribe( pending.listener );
		}
	}

	/**
	 * Subscribe to changes to any data, either in all stores in registry, or
	 * in one specific store.
	 *
	 * @param listener              Listener function.
	 * @param storeNameOrDescriptor Optional store name.
	 *
	 * @return Unsubscribe function.
	 */
	const subscribe = (
		listener: () => void,
		storeNameOrDescriptor?: StoreNameOrDescriptor
	): ( () => void ) => {
		// subscribe to all stores
		if ( ! storeNameOrDescriptor ) {
			return emitter.subscribe( listener );
		}

		// subscribe to one store
		const storeName = getStoreName( storeNameOrDescriptor );
		const store = stores[ storeName ];
		if ( store ) {
			return store.subscribe( listener );
		}

		// Trying to access a store that hasn't been registered,
		// this is a pattern rarely used but seen in some places.
		// We create a "pending" listener and wire it up on store registration.
		// See https://github.com/WordPress/gutenberg/pull/27466 for more info.
		if ( ! parent ) {
			return subscribePending( storeName, listener );
		}

		return parent.subscribe( listener, storeNameOrDescriptor );
	};

	/**
	 * Calls a selector given the current state and extra arguments.
	 *
	 * @param storeNameOrDescriptor Unique namespace identifier for the store
	 *                              or the store descriptor.
	 *
	 * @return The selector's returned value.
	 */
	function select( storeNameOrDescriptor: StoreNameOrDescriptor ) {
		const storeName = getStoreName( storeNameOrDescriptor );
		listeningStores?.add( storeName );
		const store = stores[ storeName ];
		if ( store ) {
			return store.getSelectors();
		}

		return parent?.select( storeName );
	}

	function __unstableMarkListeningStores< T >(
		this: DataRegistry,
		callback: () => T,
		ref: { current: string[] | null }
	): T {
		listeningStores = new Set();
		try {
			return callback.call( this );
		} finally {
			ref.current = Array.from( listeningStores );
			listeningStores = null;
		}
	}

	/**
	 * Given a store descriptor, returns an object containing the store's selectors pre-bound to
	 * state so that you only need to supply additional arguments, and modified so that they return
	 * promises that resolve to their eventual values, after any resolvers have ran.
	 *
	 * @param storeNameOrDescriptor The store descriptor. The legacy calling
	 *                              convention of passing the store name is
	 *                              also supported.
	 *
	 * @return Each key of the object matches the name of a selector.
	 */
	function resolveSelect( storeNameOrDescriptor: StoreNameOrDescriptor ) {
		const storeName = getStoreName( storeNameOrDescriptor );
		listeningStores?.add( storeName );
		const store = stores[ storeName ];
		if ( store ) {
			return store.getResolveSelectors!();
		}

		return parent && parent.resolveSelect( storeName );
	}

	/**
	 * Given a store descriptor, returns an object containing the store's selectors pre-bound to
	 * state so that you only need to supply additional arguments, and modified so that they throw
	 * promises in case the selector is not resolved yet.
	 *
	 * @param storeNameOrDescriptor The store descriptor. The legacy calling
	 *                              convention of passing the store name is
	 *                              also supported.
	 *
	 * @return Object containing the store's suspense-wrapped selectors.
	 */
	function suspendSelect( storeNameOrDescriptor: StoreNameOrDescriptor ) {
		const storeName = getStoreName( storeNameOrDescriptor );
		listeningStores?.add( storeName );
		const store = stores[ storeName ];
		if ( store ) {
			return store.getSuspendSelectors!();
		}

		return parent && parent.suspendSelect( storeName );
	}

	/**
	 * Returns the available actions for a part of the state.
	 *
	 * @param storeNameOrDescriptor Unique namespace identifier for the store
	 *                              or the store descriptor.
	 *
	 * @return The action's returned value.
	 */
	function dispatch( storeNameOrDescriptor: StoreNameOrDescriptor ) {
		const storeName = getStoreName( storeNameOrDescriptor );
		const store = stores[ storeName ];
		if ( store ) {
			return store.getActions();
		}

		return parent && parent.dispatch( storeName );
	}

	//
	// Deprecated
	// TODO: Remove this after `use()` is removed.
	function withPlugins(
		attributes: Record< string, unknown >
	): Record< string, unknown > {
		return Object.fromEntries(
			Object.entries( attributes ).map( ( [ key, attribute ] ) => {
				if ( typeof attribute !== 'function' ) {
					return [ key, attribute ];
				}
				return [
					key,
					( ...args: unknown[] ) => {
						return ( registry as any )[ key ]( ...args );
					},
				];
			} )
		);
	}

	/**
	 * Registers a store instance.
	 *
	 * @param name            Store registry name.
	 * @param createStoreFunc Function that creates a store object (getSelectors, getActions, subscribe).
	 */
	function registerStoreInstance(
		name: string,
		createStoreFunc: () => InternalStoreInstance
	): InternalStoreInstance {
		if ( stores[ name ] ) {
			// eslint-disable-next-line no-console
			console.error( 'Store "' + name + '" is already registered.' );
			return stores[ name ];
		}

		const store: any = createStoreFunc();

		if ( typeof store.getSelectors !== 'function' ) {
			throw new TypeError( 'store.getSelectors must be a function' );
		}
		if ( typeof store.getActions !== 'function' ) {
			throw new TypeError( 'store.getActions must be a function' );
		}
		if ( typeof store.subscribe !== 'function' ) {
			throw new TypeError( 'store.subscribe must be a function' );
		}
		// The emitter is used to keep track of active listeners when the registry
		// get paused, that way, when resumed we should be able to call all these
		// pending listeners.
		store.emitter = createEmitter();
		store.subscribe( () => store.emitter.emit() );
		store.subscribe = ( listener: () => void ) =>
			store.emitter.subscribe( listener );
		stores[ name ] = store;
		store.subscribe( globalListener );
		connectPendingListeners( name, store );

		// Copy private actions and selectors from the parent store.
		if ( parent ) {
			try {
				unlock( store.store ).registerPrivateActions(
					unlock( parent ).privateActionsOf( name )
				);
				unlock( store.store ).registerPrivateSelectors(
					unlock( parent ).privateSelectorsOf( name )
				);
			} catch {
				// unlock() throws if store.store was not locked.
				// The error indicates there's nothing to do here so let's
				// ignore it.
			}
		}

		return store;
	}

	/**
	 * Registers a new store given a store descriptor.
	 *
	 * @param store Store descriptor.
	 */
	function register( store: StoreDescriptor< AnyConfig > ) {
		registerStoreInstance(
			store.name,
			() => store.instantiate( registry ) as InternalStoreInstance
		);
	}

	function registerGenericStore(
		name: string,
		store: InternalStoreInstance
	) {
		deprecated( 'wp.data.registerGenericStore', {
			since: '5.9',
			alternative: 'wp.data.register( storeDescriptor )',
		} );
		registerStoreInstance( name, () => store );
	}

	/**
	 * Registers a standard `@wordpress/data` store.
	 *
	 * @param storeName Unique namespace identifier.
	 * @param options   Store description (reducer, actions, selectors, resolvers).
	 *
	 * @return Registered store object.
	 */
	function registerStore(
		storeName: string,
		options: ReduxStoreConfig< any, any, any >
	) {
		if ( ! options.reducer ) {
			throw new TypeError( 'Must specify store reducer' );
		}

		const store = registerStoreInstance(
			storeName,
			() =>
				createReduxStore( storeName, options ).instantiate(
					registry
				) as InternalStoreInstance
		);

		return store.store;
	}

	function batch( callback: () => void ) {
		// If we're already batching, just call the callback.
		if ( emitter.isPaused ) {
			callback();
			return;
		}

		emitter.pause();
		Object.values( stores ).forEach( ( store ) => store.emitter.pause() );
		try {
			callback();
		} finally {
			emitter.resume();
			Object.values( stores ).forEach( ( store ) =>
				store.emitter.resume()
			);
		}
	}

	let registry: DataRegistry = {
		batch,
		stores,
		namespaces: stores, // TODO: Deprecate/remove this.
		subscribe,
		select,
		resolveSelect,
		suspendSelect,
		dispatch,
		use,
		register,
		registerGenericStore,
		registerStore,
		__unstableMarkListeningStores,
	} as DataRegistry;

	//
	// TODO:
	// This function will be deprecated as soon as it is no longer internally referenced.
	function use( plugin: DataPlugin, options?: Record< string, unknown > ) {
		if ( ! plugin ) {
			return;
		}

		registry = {
			...registry,
			...plugin( registry, options ),
		};

		return registry;
	}

	registry.register( coreDataStore );

	for ( const [ name, config ] of Object.entries( storeConfigs ) ) {
		registry.register( createReduxStore( name, config ) );
	}

	if ( parent ) {
		parent.subscribe( globalListener );
	}

	const registryWithPlugins = withPlugins(
		registry as unknown as Record< string, unknown >
	);
	lock( registryWithPlugins, {
		privateActionsOf: ( name: string ) => {
			try {
				return unlock( stores[ name ].store ).privateActions;
			} catch {
				// unlock() throws an error the store was not locked – this means
				// there no private actions are available
				return {};
			}
		},
		privateSelectorsOf: ( name: string ) => {
			try {
				return unlock( stores[ name ].store ).privateSelectors;
			} catch {
				return {};
			}
		},
	} );
	return registryWithPlugins as unknown as DataRegistry;
}
