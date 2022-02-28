type MapOf< T > = { [ name: string ]: T };

// type AnyState = any;
export type ActionCreator = Function | Generator;
export type Resolver = Function | Generator;
type IsValidArg< T > = T extends object
	? keyof T extends never
		? false
		: true
	: true;

export type Selector< T > = T extends (
	a: infer A,
	b: infer B,
	c: infer C,
	d: infer D,
	e: infer E,
	f: infer F,
	g: infer G,
	h: infer H,
	i: infer I,
	j: infer J
) => infer R
	? IsValidArg< J > extends true
		? ( a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I, j: J ) => R
		: IsValidArg< I > extends true
		? ( a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I ) => R
		: IsValidArg< H > extends true
		? ( a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H ) => R
		: IsValidArg< G > extends true
		? ( a: A, b: B, c: C, d: D, e: E, f: F, g: G ) => R
		: IsValidArg< F > extends true
		? ( a: A, b: B, c: C, d: D, e: E, f: F ) => R
		: IsValidArg< E > extends true
		? ( a: A, b: B, c: C, d: D, e: E ) => R
		: IsValidArg< D > extends true
		? ( a: A, b: B, c: C, d: D ) => R
		: IsValidArg< C > extends true
		? ( a: A, b: B, c: C ) => R
		: IsValidArg< B > extends true
		? ( a: A, b: B ) => R
		: IsValidArg< A > extends true
		? ( a: A ) => R
		: () => R
	: never;

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
	Selectors extends MapOf< Selector< any > >
> {
	initialState?: State;
	reducer: ( state: any, action: any ) => any;
	actions?: ActionCreators;
	resolvers?: MapOf< Resolver >;
	selectors?: Selectors;
	controls?: MapOf< Function >;
}

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

//
// Type Helpers
//

type ActionCreatorsOf<
	Config extends AnyConfig
> = Config extends ReduxStoreConfig< any, infer ActionCreators, any >
	? { [ name in keyof ActionCreators ]: Function | Generator }
	: never;

export type SelectorsOf<
	Config extends AnyConfig,
	Selectors extends MapOf<
		Selector< any >
	> = Config extends ReduxStoreConfig< any, any, infer C > ? C : never
> = { [ name in keyof Selectors ]: Selectors[ name ] };

type OmitFirstArg< F > = F extends ( x: any, ...args: infer P ) => infer R
	? ( ...args: P ) => R
	: never;

export type BoundSelectorsOf<
	Config extends AnyConfig,
	Selectors extends MapOf<
		Selector< any >
	> = Config extends ReduxStoreConfig< any, any, infer C > ? C : never
> = { [ name in keyof Selectors ]: OmitFirstArg< Selectors[ name ] > };

/**
 * Internal dependencies
 */
// @ts-ignore
import { default as subCreateReduxStore } from './redux-store';

export function createReduxStore< C extends ReduxStoreConfig< any, any, any > >(
	key: string,
	config: C
): StoreDescriptor< C > {
	return subCreateReduxStore( key, config );
}

export function doSelect< D extends StoreDescriptor< any >, T >(
	callback: (
		select: (
			descriptor: D
		) => D extends StoreDescriptor< infer C > ? SelectorsOf< C > : number
	) => T
): T {
	return {} as any;
}
