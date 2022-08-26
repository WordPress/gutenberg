/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { combineReducers as reduxCombineReducers } from 'redux';

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
	Selectors
> {
	initialState?: State;
	reducer: ( state: any, action: any ) => any;
	actions?: ActionCreators;
	resolvers?: MapOf< Resolver >;
	selectors?: Selectors;
	controls?: MapOf< Function >;
}

export type UseSelectReturn< F extends MapSelect | StoreDescriptor< any > > =
	F extends MapSelect
		? ReturnType< F >
		: F extends StoreDescriptor< any >
		? CurriedSelectorsOf< F >
		: never;

export type UseDispatchReturn< StoreNameOrDescriptor > =
	StoreNameOrDescriptor extends StoreDescriptor< any >
		? ActionCreatorsOf< ConfigOf< StoreNameOrDescriptor > >
		: StoreNameOrDescriptor extends undefined
		? DispatchFunction
		: any;

export type DispatchFunction = < StoreNameOrDescriptor >(
	store: StoreNameOrDescriptor
) => StoreNameOrDescriptor extends StoreDescriptor< any >
	? ActionCreatorsOf< ConfigOf< StoreNameOrDescriptor > >
	: any;

export type MapSelect = (
	select: SelectFunction,
	registry: DataRegistry
) => any;

export type SelectFunction = < S >( store: S ) => CurriedSelectorsOf< S >;

export type CurriedSelectorsOf< S > = S extends StoreDescriptor<
	ReduxStoreConfig< any, any, infer Selectors >
>
	? { [ key in keyof Selectors ]: CurriedState< Selectors[ key ] > }
	: never;

/**
 * Removes the first argument from a function
 *
 * This is designed to remove the `state` parameter from
 * registered selectors since that argument is supplied
 * by the editor when calling `select(…)`.
 *
 * For functions with no arguments, which some selectors
 * are free to define, returns the original function.
 */
export type CurriedState< F > = F extends (
	state: any,
	...args: infer P
) => infer R
	? ( ...args: P ) => R
	: F;

export interface DataRegistry {
	register: ( store: StoreDescriptor< any > ) => void;
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

export type ActionCreatorsOf< Config extends AnyConfig > =
	Config extends ReduxStoreConfig< any, infer ActionCreators, any >
		? ActionCreators
		: never;

type SelectorsOf< Config extends AnyConfig > = Config extends ReduxStoreConfig<
	any,
	any,
	infer Selectors
>
	? { [ name in keyof Selectors ]: Function }
	: never;

export type combineReducers = typeof reduxCombineReducers;
