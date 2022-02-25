/**
 * External dependencies
 */
import type { MutableRefObject } from 'react';
import type { Store as ReduxStore } from 'redux';

type MapOf< T > = { [ name: string ]: T };

export type ActionCreator = Function | Generator;
export type Resolver = Function | Generator;
export type Selector = Function;

export type AnyConfig = ReduxStoreConfig< any, any, any >;

export interface StoreInstance< Config extends AnyConfig > {
	getSelectors: () => SelectorsOf< Config >;
	getActions: () => ActionCreatorsOf< Config >;
	subscribe: ( listener: () => void ) => () => void;
}

export interface StoreDescriptor< Config extends AnyConfig > {
	/**
	 * Store Name
	 */
	name: string;

	/**
	 * Creates a store instance
	 */
	instantiate: ( registry: DataRegistry ) => StoreInstance< Config >;
}

export interface ReduxStoreConfig<
	State,
	ActionCreators extends MapOf< ActionCreator >,
	Selectors extends MapOf< Selector >
> {
	initialState?: State;
	reducer: ( state: any, action: any ) => any;
	actions?: ActionCreators;
	resolvers?: MapOf< Resolver >;
	selectors?: Selectors;
	controls?: MapOf< Function >;
}

/** Unsubscribes from a registered listener. */
export interface Unsubscriber {
	(): void;
}

export interface DataStores {}

export interface Stores extends DataStores {}

type Store<
	StoreRef extends Stores[ keyof Stores ] | keyof Stores
> = StoreRef extends AnyConfig
	? StoreRef
	: StoreRef extends keyof Stores
	? Stores[ StoreRef ]
	: never;

type CurriedState< F extends ( ...args: any[] ) => any > = F extends (
	state: any,
	...args: infer P
) => infer R
	? ( ...args: P ) => R
	: F;

type Resolvable<
	F extends ( ...args: any[] ) => any
> = ReturnType< F > extends Promise< any >
	? F
	: ( ...args: Parameters< F > ) => Promise< ReturnType< F > >;

export interface DataRegistry {
	/** Apply multiple store updates without calling store listeners until all have finished */
	batch( executor: () => void ): void;

	/** Returns the available actions for a given store. */
	dispatch< StoreRef extends Stores[ keyof Stores ] | keyof Stores >(
		store: StoreRef
	): NonNullable< Store< StoreRef >[ 'actions' ] >;

	/** Registers a new store into the registry. */
	register( store: StoreDescriptor< any > ): void;

	/** Given a namespace key and store description, registers a new Redux store into the registry. */
	registerStore(
		name: string,
		store: StoreDescriptor<any>
	): ReduxStore;

	/**
	 * Returns a version of the available selectors for a given store that returns
	 * a Promise which resolves after all associated resolvers have finished.
	 */
	resolveSelect<
		StoreRef extends Stores[ keyof Stores ] | keyof Stores,
		Selectors extends Store< StoreRef >[ 'selectors' ]
	>(
		store: StoreRef
	): NonNullable<
		{
			[ Name in keyof Selectors ]: Resolvable<
				CurriedState< Selectors[ Name ] >
			>;
		}
	>;

	/** Returns the available selectors for a given store. */
	select<
		StoreRef extends Stores[ keyof Stores ] | keyof Stores,
		Selectors extends Store< StoreRef >[ 'selectors' ]
	>(
		store: StoreRef
	): NonNullable<
		{
			[ Name in keyof Selectors ]: CurriedState< Selectors[ Name ] >;
		}
	>;

	/** Raw access to the underlying store instances in the registry. */
	stores: Readonly<
		{
			[ Name in keyof Stores ]: StoreInstance< Stores[ Name ] >;
		}
	>;

	/** Subscribe to changes from all registered stores. */
	subscribe( listener: () => void ): Unsubscriber;

	// Unstable and/or experimental methods

	/** Used internally by useSelect to track which stores are queried by `select` calls. */
	__experimentalMarkListeningStores<
		Callback extends ( ...args: any[] ) => any
	>(
		callback: Callback,
		listeners: MutableRefObject< string[] >
	): ReturnType< Callback >;

	/** Subscribe to changes in stores that are currently queried by useSelect. */
	__experimentalSubscribeStore(
		name: string,
		listener: () => void
	): Unsubscriber;

	// Deprecated methods and properties

	/**
	 * Legacy reference to set of store isntances in the registry.
	 *
	 * @deprecated Use registry.stores instead.
	 */
	namespaces: Readonly<
		{
			[ Name in keyof Stores ]: StoreInstance< Stores[ Name ] >;
		}
	>;

	/**
	 * Given a namespace key and settings object, registers a new store into the registry.
	 *
	 * @deprecated Use register( store ) instead.
	 */
	registerGenericStore( name: string, store: StoreDescriptor< any > ): void;

	/**
	 * Returns an enhanced version of the given registry.
	 *
	 * @deprecated
	 */
	use<
		Source extends DataRegistry,
		Enhancement extends Partial< Source > & Record< string, any >,
		Options
	>(
		plugin: ( registry: Source, options?: Options ) => Enhancement,
		options?: Options
	): Source & Enhancement;
}

export interface DataEmitter {
	emit: () => void;
	subscribe: ( listener: () => void ) => Unsubscriber;
	pause: () => void;
	resume: () => void;
	isPaused: boolean;
}

// Type Helpers.

type ActionCreatorsOf<
	Config extends AnyConfig
> = Config extends ReduxStoreConfig< any, infer ActionCreators, any >
	? ActionCreators
	: never;

type SelectorsOf< Config extends AnyConfig > = Config extends ReduxStoreConfig<
	any,
	any,
	infer Selectors
>
	? Selectors
	: never;
