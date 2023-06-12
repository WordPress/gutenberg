/**
 * Internal dependencies
 */
import type { AnyConfig, CurriedSelectorsOf, StoreDescriptor } from './types';
import defaultRegistry from './default-registry';

/**
 * Given a store descriptor, returns an object of the store's selectors.
 * The selector functions are been pre-bound to pass the current state automatically.
 * As a consumer, you need only pass arguments of the selector, if applicable.
 *
 *
 * @param storeNameOrDescriptor The store descriptor. The legacy calling convention
 *                              of passing the store name is also supported.
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 * import { store as myCustomStore } from 'my-custom-store';
 *
 * select( myCustomStore ).getPrice( 'hammer' );
 * ```
 *
 * @return Object containing the store's selectors.
 */
export function select< T extends StoreDescriptor< AnyConfig > >(
	storeNameOrDescriptor: string | T
): CurriedSelectorsOf< T > {
	return defaultRegistry.select( storeNameOrDescriptor );
}
