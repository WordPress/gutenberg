/**
 * External dependencies
 */

import type {
	// eslint-disable-next-line no-restricted-imports
	combineReducers as reduxCombineReducers,
	Store as ReduxStore,
} from 'redux';

/**
 * Internal dependencies
 */
import type { DataEmitter } from './utils/emitter';
import type {
	MetadataSelectors,
	MetadataActions,
} from './redux-store/metadata/types';

type MapOf< T > = { [ name: string ]: T };

export type ActionCreator = ( ...args: any[] ) => any | Generator;
export type Resolver = Function | Generator;
export type Selector = Function;

export type AnyConfig = ReduxStoreConfig< any, any, any >;

export interface StoreInstance< Config extends AnyConfig > {
	getSelectors: () => SelectorsOf< Config >;
	getActions: () => ActionCreatorsOf< Config >;
	subscribe: ( listener: () => void ) => () => void;
}

export interface StoreDescriptor< Config extends AnyConfig = AnyConfig > {
	/**
	 * Store Name
	 */
	name: string;

	/**
	 * Creates a store instance
	 */
	instantiate: ( registry: DataRegistry ) => StoreInstance< Config >;
}

export interface ReduxStoreConfig< State, ActionCreators, Selectors > {
	initialState?: State;
	reducer: ( state: any, action: any ) => any;
	actions?: ActionCreators;
	resolvers?: MapOf< Resolver >;
	selectors?: Selectors;
	controls?: MapOf< Function >;
}

// Return type for the useSelect() hook.
export type UseSelectReturn< F extends MapSelect | StoreDescriptor< any > > =
	F extends MapSelect
		? ReturnType< F >
		: F extends StoreDescriptor< any >
		? CurriedSelectorsOf< F >
		: never;

// Return type for the useDispatch() hook.
export type UseDispatchReturn< StoreNameOrDescriptor > =
	StoreNameOrDescriptor extends StoreDescriptor< any >
		? ActionCreatorsOf< StoreNameOrDescriptor >
		: StoreNameOrDescriptor extends undefined
		? DispatchFunction
		: any;

export type DispatchFunction = < StoreNameOrDescriptor >(
	store: StoreNameOrDescriptor
) => DispatchReturn< StoreNameOrDescriptor >;

export type DispatchReturn< StoreNameOrDescriptor > =
	StoreNameOrDescriptor extends StoreDescriptor< any >
		? ActionCreatorsOf< StoreNameOrDescriptor >
		: unknown;

export type MapSelect = (
	select: SelectFunction,
	registry: DataRegistry
) => any;

export type SelectFunction = < S >( store: S ) => CurriedSelectorsOf< S >;

/**
 * Callback for store's `subscribe()` method that
 * runs when the store data has changed.
 */
export type ListenerFunction = () => void;

export type CurriedSelectorsOf< S > = S extends StoreDescriptor<
	ReduxStoreConfig< any, any, infer Selectors >
>
	? {
			[ key in keyof Selectors ]: CurriedState< Selectors[ key ] >;
	  } & MetadataSelectors< S >
	: never;

/**
 * Like CurriedState but wraps the return type in a Promise.
 * Used for resolveSelect where selectors return promises.
 *
 * For generic selectors that define PromiseCurriedSignature, that signature
 * is used directly to preserve generic type parameters (which would otherwise
 * be lost when using `infer`).
 */
type CurriedStateWithPromise< F > =
	F extends SelectorWithCustomCurrySignature & {
		PromiseCurriedSignature: infer S;
	}
		? S
		: F extends SelectorWithCustomCurrySignature & {
				CurriedSignature: ( ...args: infer P ) => infer R;
		  }
		? ( ...args: P ) => Promise< R >
		: F extends ( state: any, ...args: infer P ) => infer R
		? ( ...args: P ) => Promise< R >
		: F;

/**
 * Like CurriedSelectorsOf but each selector returns a Promise.
 * Used for resolveSelect.
 */
export type CurriedSelectorsResolveOf< S > = S extends StoreDescriptor<
	ReduxStoreConfig< any, any, infer Selectors >
>
	? {
			[ key in keyof Selectors ]: CurriedStateWithPromise<
				Selectors[ key ]
			>;
	  }
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
type CurriedState< F > = F extends SelectorWithCustomCurrySignature
	? F[ 'CurriedSignature' ]
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
	CurriedSignature: Function;
	PromiseCurriedSignature?: Function;
}

/**
 * A store name or store descriptor, used throughout the API.
 */
export type StoreNameOrDescriptor = string | StoreDescriptor;

/**
 * An isolated orchestrator of store registrations.
 *
 * Returned by `createRegistry`. Provides methods to register stores,
 * select data, dispatch actions, and subscribe to changes.
 */
export interface DataRegistry {
	batch: ( callback: () => void ) => void;
	stores: Record< string, InternalStoreInstance >;
	namespaces: Record< string, InternalStoreInstance >;
	subscribe: (
		listener: ListenerFunction,
		storeNameOrDescriptor?: StoreNameOrDescriptor
	) => () => void;
	select: {
		< S extends StoreDescriptor< any > >(
			store: S
		): CurriedSelectorsOf< S >;
		(
			store: StoreNameOrDescriptor
		): Record< string, ( ...args: any[] ) => any >;
	};
	resolveSelect: {
		< S extends StoreDescriptor< any > >(
			store: S
		): CurriedSelectorsResolveOf< S >;
		(
			store: StoreNameOrDescriptor
		): Record< string, ( ...args: any[] ) => Promise< any > >;
	};
	suspendSelect: {
		< S extends StoreDescriptor< any > >(
			store: S
		): CurriedSelectorsOf< S >;
		(
			store: StoreNameOrDescriptor
		): Record< string, ( ...args: any[] ) => any >;
	};
	dispatch: {
		< S extends StoreDescriptor< any > >( store: S ): ActionCreatorsOf< S >;
		(
			store: StoreNameOrDescriptor
		): Record< string, ( ...args: any[] ) => any >;
	};
	use: (
		plugin: DataPlugin,
		options?: Record< string, unknown >
	) => DataRegistry;
	register: ( store: StoreDescriptor< any > ) => void;
	registerGenericStore: (
		name: string,
		store: StoreInstance< AnyConfig >
	) => void;
	registerStore: (
		storeName: string,
		options: ReduxStoreConfig< any, any, any >
	) => ReduxStore;
	__unstableMarkListeningStores: < T >(
		callback: () => T,
		ref: { current: string[] | null }
	) => T;
}

/**
 * The plugin function signature.
 */
export type DataPlugin = (
	registry: DataRegistry,
	options?: Record< string, unknown >
) => Partial< DataRegistry >;

/**
 * Status of a selector resolution.
 */
export type ResolutionStatus = 'resolving' | 'finished' | 'error';

/**
 * State value for a single resolution.
 */
export type ResolutionState =
	| { status: 'resolving' }
	| { status: 'finished' }
	| { status: 'error'; error: Error | unknown };

/**
 * A normalized resolver with a `fulfill` method and optional `isFulfilled`.
 */
export interface NormalizedResolver {
	/**
	 * The function to call to fulfill the resolver.
	 */
	fulfill: ( ...args: any[] ) => any;
	/**
	 * Optional function to check if the resolver is already fulfilled.
	 */
	isFulfilled?: ( state: any, ...args: any[] ) => boolean;
	/**
	 * Optional function to check if the resolver should be invalidated.
	 */
	shouldInvalidate?: ( action: any, ...args: any[] ) => boolean;
}

/**
 * A bound selector with optional resolver metadata.
 */
export interface BoundSelector {
	( ...args: any[] ): any;
	/**
	 * Whether this selector has a resolver attached.
	 */
	hasResolver: boolean;
	/**
	 * Optional function to normalize the arguments.
	 */
	__unstableNormalizeArgs?: ( args: any[] ) => any[];
	/**
	 * Whether this selector is a registry selector.
	 */
	isRegistrySelector?: boolean;
	/**
	 * The registry instance this selector is bound to.
	 */
	registry?: DataRegistry;
}

/**
 * The shape of a store instance as seen internally by the registry.
 * Extends the public StoreInstance with additional internal properties.
 */
export interface InternalStoreInstance< Config extends AnyConfig = AnyConfig >
	extends StoreInstance< Config > {
	/**
	 * The Redux store instance (only for Redux-based stores).
	 */
	store?: ReduxStore;
	/**
	 * The internal emitter for pause/resume batching.
	 */
	emitter: DataEmitter;
	/**
	 * The combined reducer.
	 */
	reducer?: ( state: any, action: any ) => any;
	/**
	 * Bound actions object.
	 */
	actions?: Record< string, ActionCreator >;
	/**
	 * Bound selectors object.
	 */
	selectors?: Record< string, Selector >;
	/**
	 * Resolver definitions.
	 */
	resolvers?: Record< string, NormalizedResolver >;
	/**
	 * Returns resolve-wrapped selectors.
	 */
	getResolveSelectors?: () => Record<
		string,
		( ...args: any[] ) => Promise< any >
	>;
	/**
	 * Returns suspense-wrapped selectors.
	 */
	getSuspendSelectors?: () => Record< string, ( ...args: any[] ) => any >;
}

/**
 * Control descriptor for the controls system.
 */
export interface ControlDescriptor {
	/**
	 * The type of the control action.
	 */
	type: string;
	/**
	 * The store key to target.
	 */
	storeKey: string;
	/**
	 * The name of the selector (for select/resolveSelect controls).
	 */
	selectorName?: string;
	/**
	 * The name of the action (for dispatch controls).
	 */
	actionName?: string;
	/**
	 * Arguments for the selector or action.
	 */
	args: any[];
}

/**
 * Storage interface (Web Storage API subset).
 */
export interface StorageInterface {
	getItem: ( key: string ) => string | null;
	setItem: ( key: string, value: string ) => void;
	removeItem?: ( key: string ) => void;
	clear?: VoidFunction;
}

// Type Helpers.

export type ConfigOf< S > = S extends StoreDescriptor< infer C > ? C : never;

export type ActionCreatorsOf< T > = T extends StoreDescriptor<
	ReduxStoreConfig< any, infer ActionCreators, any >
>
	? PromisifiedActionCreators< ActionCreators > & MetadataActions< T >
	: T extends ReduxStoreConfig< any, infer ActionCreators, any >
	? PromisifiedActionCreators< ActionCreators >
	: never;

// Takes an object containing all action creators for a store and updates the
// return type of each action creator to account for internal registry details --
// for example, dispatched actions are wrapped with a Promise.
export type PromisifiedActionCreators< ActionCreators > = {
	[ Action in keyof ActionCreators ]: ActionCreators[ Action ] extends ActionCreator
		? PromisifyActionCreator< ActionCreators[ Action ] >
		: ActionCreators[ Action ];
};

// Wraps action creator return types with a Promise and handles thunks and generators.
export type PromisifyActionCreator< Action extends ActionCreator > = (
	...args: Parameters< Action >
) => Promise<
	ReturnType< Action > extends ( ..._args: any[] ) => any
		? ThunkReturnType< Action >
		: ReturnType< Action > extends Generator< any, infer TReturn, any >
		? TReturn
		: ReturnType< Action >
>;

// A thunk is an action creator which returns a function, which can optionally
// return a Promise. The double ReturnType unwraps the innermost function's
// return type, and Awaited gets the type the Promise resolves to. If the return
// type is not a Promise, Awaited returns that original type.
export type ThunkReturnType< Action extends ActionCreator > = Awaited<
	ReturnType< ReturnType< Action > >
>;

type SelectorsOf< Config extends AnyConfig > = Config extends ReduxStoreConfig<
	any,
	any,
	infer Selectors
>
	? { [ name in keyof Selectors ]: Function }
	: never;

/**
 * The argument object passed to every thunk function. When parameterized with
 * a store descriptor, `dispatch`, `select`, and `resolveSelect` are fully
 * typed against that store's actions and selectors.
 *
 * @example
 * ```ts
 * const myAction =
 *     ( id: number ) =>
 *     async ( { dispatch, select }: ThunkArgs< typeof myStore > ) => {
 *         const record = select.getRecord( id );
 *         dispatch.setLoading( true );
 *     };
 * ```
 */
export interface ThunkArgs< S extends StoreDescriptor = StoreDescriptor > {
	dispatch: ActionCreatorsOf< S > &
		( ( action: Record< string, unknown > | Function ) => unknown );
	select: CurriedSelectorsOf< S >;
	resolveSelect: CurriedSelectorsResolveOf< S >;
	registry: DataRegistry;
}

export type combineReducers = typeof reduxCombineReducers;
