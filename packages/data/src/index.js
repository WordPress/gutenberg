/**
 * External dependencies
 */
import combineReducers from 'turbo-combine-reducers';

/**
 * Internal dependencies
 */
import defaultRegistry from './default-registry';
import * as plugins from './plugins';

/** @typedef {import('./types').StoreDescriptor} StoreDescriptor */

export { default as withSelect } from './components/with-select';
export { default as withDispatch } from './components/with-dispatch';
export { default as withRegistry } from './components/with-registry';
export {
	RegistryProvider,
	RegistryConsumer,
	useRegistry,
} from './components/registry-provider';
export { default as useSelect } from './components/use-select';
export { default as useResolveSelect } from './components/use-resolve-select';
export { useDispatch } from './components/use-dispatch';
export { AsyncModeProvider } from './components/async-mode-provider';
export { createRegistry } from './registry';
export { createRegistrySelector, createRegistryControl } from './factory';
export { controls } from './controls';
export { default as createReduxStore } from './redux-store';

/**
 * Object of available plugins to use with a registry.
 *
 * @see [use](#use)
 *
 * @type {Object}
 */
export { plugins };

/**
 * The combineReducers helper function turns an object whose values are different
 * reducing functions into a single reducing function you can pass to registerReducer.
 *
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
export { combineReducers };

/**
 * Given the name or descriptor of a registered store, returns an object of the store's selectors.
 * The selector functions are been pre-bound to pass the current state automatically.
 * As a consumer, you need only pass arguments of the selector, if applicable.
 *
 * @param {string|StoreDescriptor} storeNameOrDescriptor Unique namespace identifier for the store
 *                                                       or the store descriptor.
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 *
 * select( 'my-shop' ).getPrice( 'hammer' );
 * ```
 *
 * @return {Object} Object containing the store's selectors.
 */
export const select = defaultRegistry.select;

/**
 * Given the name of a registered store, returns an object containing the store's
 * selectors pre-bound to state so that you only need to supply additional arguments,
 * and modified so that they return promises that resolve to their eventual values,
 * after any resolvers have ran.
 *
 * @param {string|StoreDescriptor} storeNameOrDescriptor Unique namespace identifier for the store
 *                                                       or the store descriptor.
 *
 * @example
 * ```js
 * import { resolveSelect } from '@wordpress/data';
 *
 * resolveSelect( 'my-shop' ).getPrice( 'hammer' ).then(console.log)
 * ```
 *
 * @return {Object} Object containing the store's promise-wrapped selectors.
 */
export const resolveSelect = defaultRegistry.resolveSelect;

/**
 * Given the name of a registered store, returns an object of the store's action creators.
 * Calling an action creator will cause it to be dispatched, updating the state value accordingly.
 *
 * Note: Action creators returned by the dispatch will return a promise when
 * they are called.
 *
 * @param {string|StoreDescriptor} storeNameOrDescriptor Unique namespace identifier for the store
 *                                                       or the store descriptor.
 *
 * @example
 * ```js
 * import { dispatch } from '@wordpress/data';
 *
 * dispatch( 'my-shop' ).setPrice( 'hammer', 9.75 );
 * ```
 * @return {Object} Object containing the action creators.
 */
export const dispatch = defaultRegistry.dispatch;

/**
 * Given a listener function, the function will be called any time the state value
 * of one of the registered stores has changed. This function returns a `unsubscribe`
 * function used to stop the subscription.
 *
 * @param {Function} listener Callback function.
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
export const subscribe = defaultRegistry.subscribe;

/**
 * Registers a generic store instance.
 *
 * @deprecated Use `register( storeDescriptor )` instead.
 *
 * @param {string} name  Store registry name.
 * @param {Object} store Store instance (`{ getSelectors, getActions, subscribe }`).
 */
export const registerGenericStore = defaultRegistry.registerGenericStore;

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
export const registerStore = defaultRegistry.registerStore;

/**
 * Extends a registry to inherit functionality provided by a given plugin. A
 * plugin is an object with properties aligning to that of a registry, merged
 * to extend the default registry behavior.
 *
 * @param {Object} plugin Plugin object.
 */
export const use = defaultRegistry.use;

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
export const register = defaultRegistry.register;
