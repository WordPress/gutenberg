/**
 * Internal dependencies
 */
import type {
	AnyConfig,
	CurriedSelectorsOf,
	StoreDescriptor,
	StoreNameOrDescriptor,
} from './types';
import defaultRegistry from './default-registry';

export function suspendSelect< S extends StoreDescriptor< AnyConfig > >(
	storeDescriptor: S
): CurriedSelectorsOf< S >;
export function suspendSelect(
	storeNameOrDescriptor: StoreNameOrDescriptor
): Record< string, ( ...args: any[] ) => any >;

/**
 * Given a store descriptor, returns an object containing the store's selectors pre-bound to state
 * so that you only need to supply additional arguments, and modified so that they throw promises
 * in case the selector is not resolved yet.
 *
 * @param {StoreDescriptor|string} storeNameOrDescriptor The store descriptor. The legacy calling
 *                                                       convention of passing the store name is
 *                                                       also supported.
 *
 * @return {Object} Object containing the store's suspense-wrapped selectors.
 */
export function suspendSelect( storeNameOrDescriptor: StoreNameOrDescriptor ) {
	return defaultRegistry.suspendSelect( storeNameOrDescriptor );
}
