/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';

/**
 * @typedef {import('../../types').StoreDescriptor<StoreConfig>} StoreDescriptor
 * @template {import('../../types').AnyConfig} StoreConfig
 */
/**
 * @typedef {import('../../types').UseDispatchReturn<StoreNameOrDescriptor>} UseDispatchReturn
 * @template StoreNameOrDescriptor
 */

/**
 * A custom react hook returning the current registry dispatch actions creators.
 *
 * Note: The component using this hook must be within the context of a
 * RegistryProvider.
 *
 * @template {undefined | string | StoreDescriptor<any>} StoreNameOrDescriptor
 * @param {StoreNameOrDescriptor} [storeNameOrDescriptor] Optionally provide the name of the
 *                                                        store or its descriptor from which to
 *                                                        retrieve action creators. If not
 *                                                        provided, the registry.dispatch
 *                                                        function is returned instead.
 *
 * @example
 * This illustrates a pattern where you may need to retrieve dynamic data from
 * the server via the `useSelect` hook to use in combination with the dispatch
 * action.
 *
 * ```jsx
 * import { useCallback } from 'react';
 * import { useDispatch, useSelect } from '@wordpress/data';
 * import { store as myCustomStore } from 'my-custom-store';
 *
 * function Button( { onClick, children } ) {
 *   return <button type="button" onClick={ onClick }>{ children }</button>
 * }
 *
 * const SaleButton = ( { children } ) => {
 *   const { stockNumber } = useSelect(
 *     ( select ) => select( myCustomStore ).getStockNumber(),
 *     []
 *   );
 *   const { startSale } = useDispatch( myCustomStore );
 *   const onClick = useCallback( () => {
 *     const discountPercent = stockNumber > 50 ? 10: 20;
 *     startSale( discountPercent );
 *   }, [ stockNumber ] );
 *   return <Button onClick={ onClick }>{ children }</Button>
 * }
 *
 * // Rendered somewhere in the application:
 * //
 * // <SaleButton>Start Sale!</SaleButton>
 * ```
 * @return {UseDispatchReturn<StoreNameOrDescriptor>} A custom react hook.
 */
const useDispatch = ( storeNameOrDescriptor ) => {
	const { dispatch } = useRegistry();
	return storeNameOrDescriptor === void 0
		? dispatch
		: dispatch( storeNameOrDescriptor );
};

export default useDispatch;
