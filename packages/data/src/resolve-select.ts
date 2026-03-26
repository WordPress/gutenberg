/**
 * Internal dependencies
 */
import type {
	AnyConfig,
	CurriedSelectorsResolveOf,
	StoreDescriptor,
	StoreRegistry,
	StoreNameOrDescriptor,
} from './types';
import defaultRegistry from './default-registry';

export function resolveSelect< S extends StoreDescriptor< AnyConfig > >(
	storeDescriptor: S
): CurriedSelectorsResolveOf< S >;
export function resolveSelect< K extends keyof StoreRegistry >(
	storeName: K
): CurriedSelectorsResolveOf< StoreRegistry[ K ] >;
export function resolveSelect(
	storeNameOrDescriptor: StoreNameOrDescriptor
): CurriedSelectorsResolveOf< StoreDescriptor >;

/**
 * Given a store descriptor, returns an object containing the store's selectors
 * pre-bound to state so that you only need to supply additional arguments, and
 * modified so that they return promises that resolve to their eventual values,
 * after any resolvers have ran.
 *
 * @param {StoreDescriptor|string} storeNameOrDescriptor The store descriptor. The legacy calling
 *                                                       convention of passing the store name is
 *                                                       also supported.
 *
 * @example
 * ```js
 * import { resolveSelect } from '@wordpress/data';
 * import { store as myCustomStore } from 'my-custom-store';
 *
 * resolveSelect( myCustomStore ).getPrice( 'hammer' ).then(console.log)
 * ```
 *
 * @return Object containing the store's promise-wrapped selectors.
 */
export function resolveSelect( storeNameOrDescriptor: StoreNameOrDescriptor ) {
	return defaultRegistry.resolveSelect( storeNameOrDescriptor );
}
