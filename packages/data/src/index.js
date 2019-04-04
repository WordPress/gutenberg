/**
 * External dependencies
 */
import combineReducers from 'turbo-combine-reducers';

/**
 * Internal dependencies
 */
import defaultRegistry from './default-registry';
import * as plugins from './plugins';

export { default as withSelect } from './components/with-select';
export { default as withDispatch } from './components/with-dispatch';
export { default as withRegistry } from './components/with-registry';
export { default as RegistryProvider, RegistryConsumer } from './components/registry-provider';
export { default as __experimentalAsyncModeProvider } from './components/async-mode-provider';
export { createRegistry } from './registry';
export { plugins };
export { createRegistrySelector, createRegistryControl } from './factory';

/**
 * The combineReducers helper function turns an object whose values are different
 * reducing functions into a single reducing function you can pass to registerReducer.
 *
 * @param {Object} reducers An object whose values correspond to different reducing
 *                          functions that need to be combined into one.
 *
 * @example
 * ```js
 * const { combineReducers, registerStore } = wp.data;
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
 * registerStore( 'my-shop', {
 * 	reducer: combineReducers( {
 * 		prices,
 * 		discountPercent,
 * 	} ),
 * } );
 * ```
 *
 * @return {Function}       A reducer that invokes every reducer inside the reducers
 *                          object, and constructs a state object with the same shape.
 */
export { combineReducers };

/**
 * Given the name of a registered store, returns an object of the store's selectors.
 * The selector functions are been pre-bound to pass the current state automatically.
 * As a consumer, you need only pass arguments of the selector, if applicable.
 *
 * @param {string} name Store name
 *
 * @example
 * ```js
 * const { select } = wp.data;
 *
 * select( 'my-shop' ).getPrice( 'hammer' );
 * ```
 *
 * @return {Object} Object containing the store's selectors.
 */
export const select = defaultRegistry.select;

/**
 * Given the name of a registered store, returns an object of the store's action creators.
 * Calling an action creator will cause it to be dispatched, updating the state value accordingly.
 *
 * Note: If the action creator is a generator then a promise is returned.
 * Otherwise, the dispatch will return `undefined`.
 *
 * @param {string} name Store name
 *
 * @example
 * ```js
 * const { dispatch } = wp.data;
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
 * const { subscribe } = wp.data;
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
* Registers a generic store.
*
* @param {string} key    Store registry key.
* @param {Object} config Configuration (getSelectors, getActions, subscribe).
*/
export const registerGenericStore = defaultRegistry.registerGenericStore;

/**
 * Registers a standard `@wordpress/data` store.
 *
 * @param {string} reducerKey Reducer key.
 * @param {Object} options    Store description (reducer, actions, selectors, resolvers).
 *
 * @return {Object} Registered store object.
 */
export const registerStore = defaultRegistry.registerStore;
export const use = defaultRegistry.use;
