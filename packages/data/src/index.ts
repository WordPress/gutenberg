/**
 * Internal dependencies
 */
import defaultRegistry from './default-registry';
import * as plugins from './plugins';
import { combineReducers as combineReducersModule } from './redux-store';

import type {
	StoreDescriptor,
	ReduxStoreConfig,
	combineReducers as CombineReducers,
} from './types';

export { default as withSelect } from './components/with-select';
export { default as withDispatch } from './components/with-dispatch';
export { default as withRegistry } from './components/with-registry';
export {
	RegistryProvider,
	RegistryConsumer,
	useRegistry,
} from './components/registry-provider';
export {
	default as useSelect,
	useSuspenseSelect,
} from './components/use-select';
export { useDispatch } from './components/use-dispatch';
export { AsyncModeProvider } from './components/async-mode-provider';
export { createRegistry } from './registry';
export { createRegistrySelector, createRegistryControl } from './factory';
export { createSelector } from './create-selector';
export { controls } from './controls';
export { default as createReduxStore } from './redux-store';
export { dispatch } from './dispatch';
export { select } from './select';
export { resolveSelect } from './resolve-select';
export { suspendSelect } from './suspend-select';

export type * from './types';

/**
 * Object of available plugins to use with a registry.
 *
 * @see [use](#use)
 */
export { plugins };

/**
 * The combineReducers helper function turns an object whose values are different
 * reducing functions into a single reducing function you can pass to registerReducer.
 *
 * @type  {import('./types').combineReducers}
 * @param {Object} reducers An object whose values correspond to different reducing
 *                          functions that need to be combined into one.
 *
 * @example
 * ```js
 * import { combineReducers, createReduxStore, register } from '@wordpress/data';
 *
 * const prices = ( state = {}, action ) => {
 * 	return action.type === 'SET_PRICE' ?
 * 		{
 * 			...state,
 * 			[ action.item ]: action.price,
 * 		} :
 * 		state;
 * };
 *
 * const discountPercent = ( state = 0, action ) => {
 * 	return action.type === 'START_SALE' ?
 * 		action.discountPercent :
 * 		state;
 * };
 *
 * const store = createReduxStore( 'my-shop', {
 * 	reducer: combineReducers( {
 * 		prices,
 * 		discountPercent,
 * 	} ),
 * } );
 * register( store );
 * ```
 *
 * @return {Function} A reducer that invokes every reducer inside the reducers
 *                    object, and constructs a state object with the same shape.
 */
export const combineReducers =
	combineReducersModule as unknown as CombineReducers;

/**
 * Given a listener function, the function will be called any time the state value
 * of one of the registered stores has changed. If you specify the optional
 * `storeNameOrDescriptor` parameter, the listener function will be called only
 * on updates on that one specific registered store.
 *
 * This function returns an `unsubscribe` function used to stop the subscription.
 *
 * @param {Function}                listener              Callback function.
 * @param {string|StoreDescriptor?} storeNameOrDescriptor Optional store name.
 *
 * @example
 * ```js
 * import { subscribe } from '@wordpress/data';
 *
 * const unsubscribe = subscribe( () => {
 * 	// You could use this opportunity to test whether the derived result of a
 * 	// selector has subsequently changed as the result of a state update.
 * } );
 *
 * // Later, if necessary...
 * unsubscribe();
 * ```
 */
export const subscribe = (
	listener: () => void,
	storeNameOrDescriptor?:
		| string
		| StoreDescriptor< ReduxStoreConfig< any, any, any > >
): ( () => void ) =>
	defaultRegistry.subscribe( listener, storeNameOrDescriptor );

/**
 * Registers a generic store instance.
 *
 * @deprecated Use `register( storeDescriptor )` instead.
 *
 * @param {string} name  Store registry name.
 * @param {Object} store Store instance (`{ getSelectors, getActions, subscribe }`).
 */
export const registerGenericStore: Function =
	defaultRegistry.registerGenericStore;

/**
 * Registers a standard `@wordpress/data` store.
 *
 * @deprecated Use `register` instead.
 *
 * @param {string} storeName Unique namespace identifier for the store.
 * @param {Object} options   Store description (reducer, actions, selectors, resolvers).
 *
 * @return {Object} Registered store object.
 */
export const registerStore: Function = defaultRegistry.registerStore;

/**
 * Extends a registry to inherit functionality provided by a given plugin. A
 * plugin is an object with properties aligning to that of a registry, merged
 * to extend the default registry behavior.
 *
 * @param {Object} plugin Plugin object.
 */
export const use: any = defaultRegistry.use;

/**
 * Registers a standard `@wordpress/data` store descriptor.
 *
 * @example
 * ```js
 * import { createReduxStore, register } from '@wordpress/data';
 *
 * const store = createReduxStore( 'demo', {
 *     reducer: ( state = 'OK' ) => state,
 *     selectors: {
 *         getValue: ( state ) => state,
 *     },
 * } );
 * register( store );
 * ```
 *
 * @param {StoreDescriptor} store Store descriptor.
 */
export const register = (
	store: StoreDescriptor< ReduxStoreConfig< any, any, any > >
): void => defaultRegistry.register( store );
