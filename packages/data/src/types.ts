/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Consumer, Provider } from 'react';
import type { AnyAction as Action, Reducer } from 'redux';

/**
 * Re-exports
 */
export type { Action };

//
// Core functionality
//
export type SelectorMap = Record<
	string,
	< T = unknown >( ...args: readonly any[] ) => T
>;
export type DispatcherMap = Record<
	string,
	< T = void >( ...args: readonly any[] ) => T
>;

/**
 * Subscribe to any changes to the store
 *
 * @param  callback Will be invoked whenever there are any updates to the store.
 * @return        A callback that can be invoked to unsubscribe.
 *
 * @example
 *
 * const unsubscribe = subscribe( () => {
 *     // You could use this opportunity to test whether the derived result of a
 *     // selector has subsequently changed as the result of a state update.
 * } );
 *
 * // Later, if necessary...
 * unsubscribe();
 *
 */
export type Subscriber = ( callback: () => void ) => () => void;
export type Dispatch = ( key: string ) => DispatcherMap;
export type Select = ( key: string ) => SelectorMap;

//
// Stores
//
export interface GenericStoreConfig {
	getActions(): DispatcherMap;
	getSelectors(): SelectorMap;
	subscribe: Subscriber;
}

export interface StoreConfig< S > {
	reducer: Reducer< S >;
	actions?: {
		[ k: string ]: ( ...args: readonly any[] ) => Action | Generator< any >;
	};
	selectors?: {
		[ k: string ]: ( state: S, ...args: readonly any[] ) => any;
	};
	resolvers?: {
		[ k: string ]: ( ...args: readonly any[] ) => any;
	};
	controls?: {
		[ k: string ]: ( action: Action ) => any;
	};
	initialState?: S;

	/**
	 * Use persist with the persistence plugin to persist state.
	 *
	 * The registry must use the `persistence` plugin.
	 *
	 * Set to `true` to persist all state, or pass an array of state keys to persist.
	 *
	 * @example
	 *
	 * import { plugins, registerStore, use } from '@wordpress/data';
	 *
	 * use( plugins.persistence, { storageKey: 'example' } );
	 *
	 * registerStore( 'my-plugin', {
	 *   // …
	 *   persist: [ 'state-key-to-persist' ],
	 * } );
	 */
	persist?: true | Array< keyof S >;
}

export interface Store< S, A extends Action = Action > {
	getState(): S;
	subscribe: Subscriber;
	dispatch( action: A ): A;
}

export type RegisterGenericStore = (
	key: string,
	config: GenericStoreConfig
) => void;

export type RegisterStore< T = {} > = (
	key: string,
	config: StoreConfig< T >
) => Store< T >;

//
// Registry
//
export interface DataRegistry {
	dispatch: Dispatch;
	registerGenericStore: RegisterGenericStore;
	registerStore: RegisterStore;
	select: Select;
	subscribe: Subscriber;
}

export type CreateRegister = (
	storeConfigs?: object,
	parent?: DataRegistry
) => DataRegistry;

export type RegistryConsumer = Consumer< DataRegistry >;
export type RegistryProvider = Provider< DataRegistry >;

//
// React Hooks
//
export type UseRegister = () => DataRegistry;
export type UseSelect< T > = (
	mapSelect: ( s: Select ) => T,
	deps?: readonly any[]
) => T;
export type UseDispatch = Dispatch & { (): Dispatch };

//
// Plugins
//
export type Plugin< T extends Record< string, any > > = (
	registry: DataRegistry,
	options: T
) => Partial< DataRegistry >;

export type Use< T > = ( plugin: Plugin< T >, options: T ) => DataRegistry;
