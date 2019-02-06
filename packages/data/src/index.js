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
export { default as RegistryProvider, RegistryConsumer } from './components/registry-provider';
export { default as __experimentalAsyncModeProvider } from './components/async-mode-provider';
export { createRegistry } from './registry';
export { plugins };
export { createRegistrySelector } from './factory';

/**
 * The combineReducers helper function turns an object whose values are different
 * reducing functions into a single reducing function you can pass to registerReducer.
 *
 * @param {Object} reducers An object whose values correspond to different reducing
 *                          functions that need to be combined into one.
 *
 * @return {Function}       A reducer that invokes every reducer inside the reducers
 *                          object, and constructs a state object with the same shape.
 */
export { combineReducers };

export const select = defaultRegistry.select;
export const dispatch = defaultRegistry.dispatch;
export const subscribe = defaultRegistry.subscribe;
export const registerGenericStore = defaultRegistry.registerGenericStore;
export const registerStore = defaultRegistry.registerStore;
export const use = defaultRegistry.use;
