type MapOf< T > = { [ name: string ]: T };

// type AnyState = any;
export type ActionCreator = Function | Generator;
export type Resolver = Function | Generator;

type TSelector = Function;
type TSelectors = MapOf< TSelector >;
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

export interface ReduxStoreConfig<
	State,
	ActionCreators extends MapOf< ActionCreator >,
	Selectors extends TSelectors
> {
	initialState?: State;
	reducer: ( state: any, action: any ) => any;
	actions?: ActionCreators;
	resolvers?: MapOf< Resolver >;
	selectors?: Selectors;
	controls?: MapOf< Function >;
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
	? ActionCreators
	: never;

export type SelectorsOf< Config > = Config extends ReduxStoreConfig<
	any,
	any,
	infer Selectors
>
	? Selectors
	: never;

export type BoundSelectorsOf< Config > = Config extends ReduxStoreConfig<
	any,
	any,
	infer Selectors
>
	? {
			[ name in keyof Selectors ]: OmitFirstArg< Selectors[ name ] >;
	  }
	: never;
export type ConfigOf< D > = D extends StoreDescriptor< infer C > ? C : never;

type OmitFirstArg< F > = F extends ( x: any, ...args: infer P ) => infer R
	? ( ...args: P ) => R
	: never;

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

type BoundSelectorsOfDescriptor = < D >(
	descriptor: D
) => BoundSelectorsOf< ConfigOf< D > >;

export function doSelect< D, T >(
	callback: ( select: BoundSelectorsOfDescriptor ) => T
): T {
	return {} as any;
}

export function doDispatch< D, T >(
	descriptor: D
): ActionCreatorsOf< ConfigOf< D > > {
	return {} as any;
}

export interface DataRegistry< Stores extends StoreDescriptor[] = any > {
	register: ( store: StoreDescriptor< any > ) => void;
	dispatch: typeof doDispatch;
	select: typeof doSelect;
}

type ThunkArgs< D extends StoreDescriptor > = {
	select: BoundSelectorsOf< ConfigOf< D > > & ( < T >( state: any ) => T );
	dispatch: ActionCreatorsOf< ConfigOf< D > > & ( ( action: any ) => void );
};
export type ThunkOf< D extends StoreDescriptor > = () => < T >(
	args: ThunkArgs< D >
) => T;
