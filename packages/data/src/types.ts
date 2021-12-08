/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { MutableRefObject } from 'react';

export type MapOf< T > = { [ name: string ]: T };

export type ActionCreator = Function | Generator;
export type Resolver = Function | Generator;
export type Selector = Function;

export type AnyConfig = ReduxStoreConfig< any, any, any >;

export interface SelectMapper {
	(
		select: ( reference: StoreReference ) => MapOf< Function >,
		registry: DataRegistry
	): unknown;
}
export type SelectChooser = SelectMapper | StoreReference;
export type StoreReference = StoreDescriptor< any > | string;

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

export interface DataRegistry {
	__experimentalMarkListeningStores: (
		callback: ( this: DataRegistry ) => unknown,
		listeningStores: MutableRefObject< unknown >
	) => unknown;
	__experimentalSubscribeStore: (
		storeName: string,
		listener: () => void
	) => ReturnType< DataEmitter[ 'subscribe' ] >;

	register: ( store: StoreDescriptor< any > ) => void;
	select: ( chooser: SelectChooser, deps?: unknown[] ) => any;
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

type SelectorsOf< Config extends AnyConfig > = Config extends ReduxStoreConfig<
	any,
	any,
	infer Selectors
>
	? { [ name in keyof Selectors ]: Function }
	: never;
