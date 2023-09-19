/**
 * Internal dependencies
 */
import type { AnyConfig, StoreDescriptor, DispatchReturn } from './types';
import defaultRegistry from './default-registry';

/**
 * Given a store descriptor, returns an object of the store's action creators.
 * Calling an action creator will cause it to be dispatched, updating the state value accordingly.
 *
 * Note: Action creators returned by the dispatch will return a promise when
 * they are called.
 *
 * @param storeNameOrDescriptor The store descriptor. The legacy calling convention of passing
 *                              the store name is also supported.
 *
 * @example
 * ```js
 * import { dispatch } from '@wordpress/data';
 * import { store as myCustomStore } from 'my-custom-store';
 *
 * dispatch( myCustomStore ).setPrice( 'hammer', 9.75 );
 * ```
 * @return Object containing the action creators.
 */
export function dispatch<
	StoreNameOrDescriptor extends StoreDescriptor< AnyConfig > | string,
>(
	storeNameOrDescriptor: StoreNameOrDescriptor
): DispatchReturn< StoreNameOrDescriptor > {
	return defaultRegistry.dispatch( storeNameOrDescriptor );
}
