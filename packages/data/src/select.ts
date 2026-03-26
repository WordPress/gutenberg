/**
 * Internal dependencies
 */
import type {
	AnyConfig,
	CurriedSelectorsOf,
	StoreDescriptor,
	StoreRegistry,
	StoreNameOrDescriptor,
} from './types';
import defaultRegistry from './default-registry';

export function select< S extends StoreDescriptor< AnyConfig > >(
	storeDescriptor: S
): CurriedSelectorsOf< S >;
export function select< K extends keyof StoreRegistry >(
	storeName: K
): CurriedSelectorsOf< StoreRegistry[ K ] >;
export function select(
	storeNameOrDescriptor: StoreNameOrDescriptor
): CurriedSelectorsOf< StoreDescriptor >;

/**
 * Given a store descriptor, returns an object of the store's selectors.
 * The selector functions are been pre-bound to pass the current state automatically.
 * As a consumer, you need only pass arguments of the selector, if applicable.
 *
 * Warning: This global `select` function only works with the default registry.
 * It will not work with custom `RegistryProvider` or `BlockEditorProvider` contexts.
 * In React components, prefer the `useSelect` hook instead, which is registry-aware.
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
export function select( storeNameOrDescriptor: StoreNameOrDescriptor ) {
	return defaultRegistry.select( storeNameOrDescriptor );
}
