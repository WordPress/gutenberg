/**
 * External dependencies
 */
import type { MutableRefObject } from 'react';
import type { Store as ReduxStore } from 'redux';

type MapOf< T > = { [ name: string ]: T };

export type ActionCreator = ( ...args: any[] ) => any | Generator;
export type Resolver = ( ...args: any[] ) => any | Generator;
export type Selector = ( ...args: any[] ) => any;

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
	resolvers?: ResolversOf< Selectors >;
	selectors?: Selectors;
	controls?: MapOf< Function >;
}

/** Unsubscribes from a registered listener. */
export interface Unsubscriber {
	(): void;
}

export interface DataStores {}

export interface Stores extends DataStores {}

/**
 * Returns a store config given a store name or an actual store config.
 *
 * Functions in the data registry typically accept either the name of
 * a store, e.g. 'core/editor', or they accept the actual store
 * configuration object, e.g. 'import { storeConfig } from '@wordpress/editor'`.
 *
 * This type is a convenience wrapper for turning that reference into
 * an actual store regardless of what was passed.
 *
 * Warning! Will fail if given a name not already registered. In such a
 * case add an ambient declaration for `@wordpress/data` with the store
 * name and configuration so that it can merge into the catalog of
 * registered stores.
 */
type Store<
	StoreRef extends Stores[ keyof Stores ] | keyof Stores
> = StoreRef extends AnyConfig
	? StoreRef
	: StoreRef extends keyof Stores
	? Stores[ StoreRef ]
	: never;

/**
 * Removes the first argument from a function.
 *
 * By default, it removes the `state` parameter from
 * registered selectors since that argument is supplied
 * by the editor when calling `select(…)`.
 *
 * For functions with no arguments, which some selectors
 * are free to define, returns the original function.
 *
 * It is possible to manually provide a custom curried signature
 * and avoid the automatic inference. When the
 * F generic argument passed to this helper extends the
 * SelectorWithCustomCurrySignature type, the F['CurriedSignature']
 * property is used verbatim.
 *
 * This is useful because TypeScript does not correctly remove
 * arguments from complex function signatures constrained by
 * interdependent generic parameters.
 * For more context, see https://github.com/WordPress/gutenberg/pull/41578
 */
type CurriedState< F > =
	F extends SelectorWithCustomCurrySignature
		? F['CurriedSignature']
		: F extends ( state: any, ...args: infer P ) => infer R
			? ( ...args: P ) => R
			: F;

/**
 * Utility to manually specify curried selector signatures.
 *
 * It comes handy when TypeScript can't automatically produce the
 * correct curried function signature. For example:
 *
 * ```ts
 * type BadlyInferredSignature = CurriedState<
 *     <K extends string | number>(
 *         state: any,
 *         kind: K,
 *         key: K extends string ? 'one value' : false
 *     ) => K
 * >
 * // BadlyInferredSignature evaluates to:
 * // (kind: string number, key: false "one value") => string number
 * ```
 *
 * With SelectorWithCustomCurrySignature, we can provide a custom
 * signature and avoid relying on TypeScript inference:
 * ```ts
 * interface MySelectorSignature extends SelectorWithCustomCurrySignature {
 *     <K extends string | number>(
 *         state: any,
 *         kind: K,
 *         key: K extends string ? 'one value' : false
 *     ): K;
 *
 *     CurriedSignature: <K extends string | number>(
 *         kind: K,
 *         key: K extends string ? 'one value' : false
 *     ): K;
 * }
 * type CorrectlyInferredSignature = CurriedState<MySelectorSignature>
 * // <K extends string | number>(kind: K, key: K extends string ? 'one value' : false): K;
 *
 * For even more context, see https://github.com/WordPress/gutenberg/pull/41578
 * ```
 */
export interface SelectorWithCustomCurrySignature {
	__isCurryContainer: true;
	CurriedSignature: Function;
}

/**
 * Returns a function whose return type is a Promise of the given return type.
 *
 * This is designed to take existing selectors and return a resolveSelector
 * version of it which returns a Promise of the original return type. Promises
 * flatten naturally and so if the original function already returned a Promise
 * we can reuse the existing function type.
 */
type Resolvable<
	F extends ( ...args: any[] ) => any
> = ReturnType< F > extends Promise< any >
	? F
	: ( ...args: Parameters< F > ) => Promise< ReturnType< F > >;

/**
 * "Unwraps" thunks, whereby Redux considers any function is a thunk.
 */
type ResolvedThunks< Actions extends AnyConfig[ 'actions' ] > = {
	[ Action in keyof Actions ]: Actions[ Action ] extends (
		...args: infer P
	) => ( ...thunkArgs: any ) => infer R
		? ( ...args: P ) => R
		: Actions[ Action ];
};

/**
 * For every defined selector returns a function with the same arguments
 * except for the initial `state` parameter.
 *
 * Excludes specific fields that are ignored when creating resolvers.
 *
 * @see mapResolveSelectors
 */
type ResolversOf< Selectors extends MapOf< Selector > > = NonNullable<
	{
		[ Name in keyof Selectors as Exclude<
			Name,
			NonResolveSelectFields
		> ]?: Resolvable< CurriedState< Selectors[ Name ] > >;
	}
>;

/**
 * These fields are excluded from the resolveSelect mapping.
 *
 * @see mapResolveSelectors
 */
type NonResolveSelectFields =
	| 'getIsResolving'
	| 'hasStartedResolution'
	| 'hasFinishedResolution'
	| 'isResolving'
	| 'getCachedResolvers';

export interface DataRegistry {
	/** Apply multiple store updates without calling store listeners until all have finished */
	batch( executor: () => void ): void;

	/** Returns the available actions for a given store. */
	dispatch< StoreRef extends Stores[ keyof Stores ] | keyof Stores >(
		store: StoreRef
	): ResolvedThunks< NonNullable< Store< StoreRef >[ 'actions' ] > >;

	/** Registers a new store into the registry. */
	register( store: StoreDescriptor< any > ): void;

	/** Given a namespace key and store description, registers a new Redux store into the registry. */
	registerStore( name: string, store: StoreDescriptor< any > ): ReduxStore;

	/**
	 * Returns a version of the available selectors for a given store that returns
	 * a Promise which resolves after all associated resolvers have finished.
	 */
	resolveSelect<
		StoreRef extends Stores[ keyof Stores ] | keyof Stores,
		Selectors extends Store< StoreRef >[ 'selectors' ]
	>(
		store: StoreRef
	): Selectors extends MapOf< Selector >
		? Required< ResolversOf< Selectors > >
		: {};

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
