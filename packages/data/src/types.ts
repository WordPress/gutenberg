/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { combineReducers as reduxCombineReducers, AnyAction } from 'redux';

/**
 * Internal dependencies
 */
import type {
	invalidateResolution,
	invalidateResolutionForStore,
	invalidateResolutionForStoreSelector,
} from './redux-store/metadata/actions';

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
	Selectors,
> {
	initialState?: State;
	reducer: ( state: any, action: any ) => any;
	actions?: ActionCreators;
	resolvers?: MapOf< Resolver >;
	selectors?: Selectors;
	controls?: MapOf< Function >;
}

type InvalidateResolution = typeof invalidateResolution;
type InvalidateResolutionForStore = typeof invalidateResolutionForStore;
type InvalidateResolutionForStoreSelector =
	typeof invalidateResolutionForStoreSelector;

type InvalidateResolutionAction = ReturnType< InvalidateResolution >;
type InvalidateResolutionForStoreAction =
	ReturnType< InvalidateResolutionForStore >;
type InvalidateResolutionForStoreSelectorAction =
	ReturnType< InvalidateResolutionForStoreSelector >;

/**
 * The action creators for metadata actions.
 */
type MetadataActionCreators = {
	invalidateResolution: InvalidateResolution;
	invalidateResolutionForStore: InvalidateResolutionForStore;
	invalidateResolutionForStoreSelector: InvalidateResolutionForStoreSelector;
};

/**
 * Metadata actions.
 */
type MetadataAction =
	| InvalidateResolutionAction
	| InvalidateResolutionForStoreAction
	| InvalidateResolutionForStoreSelectorAction;

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
		? ActionCreatorsOf< ConfigOf< StoreNameOrDescriptor > >
		: StoreNameOrDescriptor extends undefined
		? DispatchFunction
		: any;

export type DispatchFunction = < StoreNameOrDescriptor >(
	store: StoreNameOrDescriptor
) => DispatchReturn< StoreNameOrDescriptor >;

export type DispatchReturn< StoreNameOrDescriptor > =
	StoreNameOrDescriptor extends StoreDescriptor< any >
		? ActionCreatorsOf< ConfigOf< StoreNameOrDescriptor > >
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
	? { [ key in keyof Selectors ]: CurriedState< Selectors[ key ] > }
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
}

export interface DataRegistry {
	register: ( store: StoreDescriptor< AnyConfig > ) => void;
	dispatch: < S extends string | StoreDescriptor< AnyConfig > >(
		storeNameOrDescriptor: S
	) => S extends StoreDescriptor< infer Config >
		? ActionCreatorsOf< Config >
		: unknown;
	select: < S extends string | StoreDescriptor< AnyConfig > >(
		storeNameOrDescriptor: S
	) => S extends StoreDescriptor< infer Config >
		? CurriedSelectorsOf< Config >
		: unknown;
}

export interface DataEmitter {
	emit: () => void;
	subscribe: ( listener: () => void ) => () => void;
	pause: () => void;
	resume: () => void;
	isPaused: boolean;
}

// Type Helpers.

export type ConfigOf< S > = S extends StoreDescriptor< infer C > ? C : never;

export type BaseActionCreatorsOf< Config extends AnyConfig > =
	Config extends ReduxStoreConfig< any, infer ActionCreators, any >
		? PromisifiedActionCreators< ActionCreators >
		: never;

/**
 * The action creators for a store config.
 *
 * Also includes metadata actions creators.
 */
type ActionCreatorsOf< Config extends AnyConfig > =
	BaseActionCreatorsOf< Config > & MetadataActionCreators;

// Takes an object containing all action creators for a store and updates the
// return type of each action creator to account for internal registry details --
// for example, dispatched actions are wrapped with a Promise.
export type PromisifiedActionCreators<
	ActionCreators extends MapOf< ActionCreator >,
> = {
	[ Action in keyof ActionCreators ]: PromisifyActionCreator<
		ActionCreators[ Action ]
	>;
};

// Wraps action creator return types with a Promise and handles thunks.
export type PromisifyActionCreator< Action extends ActionCreator > = (
	...args: Parameters< Action >
) => Promise<
	ReturnType< Action > extends ( ..._args: any[] ) => any
		? ThunkReturnType< Action >
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
 * Thunk arguments.
 *
 * Used to type the arguments passed to a thunk function.
 */
export type ThunkArgs<
	Action extends AnyAction,
	S extends StoreDescriptor< AnyConfig >,
> = {
	/**
	 * Dispatch an action to the store.
	 */
	dispatch: ( S extends StoreDescriptor< infer Config >
		? ActionCreatorsOf< Config >
		: unknown ) &
		( ( action: Action | MetadataAction ) => void );

	/**
	 * Selectors for the store.
	 */
	select: CurriedSelectorsOf< S >;

	/**
	 * The store registry object.
	 */
	registry: DataRegistry;
};

export type Thunk<
	A extends AnyAction,
	S extends StoreDescriptor< AnyConfig >,
	T extends unknown = void,
> = T extends Awaited< infer R >
	? ( args: ThunkArgs< A, S > ) => Promise< R >
	: ( args: ThunkArgs< A, S > ) => T;

export type combineReducers = typeof reduxCombineReducers;
