/**
 * Internal dependencies
 */
import useSelect from '../use-select';

/**
 * Custom react hook for retrieving selectors from registered stores
 *
 * @param {string}   storeKey      Store to return selectors from.
 * @param {Function} mapSelectors  Function called on every state change. The
 *                                 returned value is exposed to the component
 *                                 implementing this hook. The function receives
 *                                 the object with all the store selectors as
 *                                 its only argument.
 * @param {Array}    deps          If provided, this memoizes the mapSelect so the
 *                                 same `mapSelect` is invoked on every state
 *                                 change unless the dependencies change.
 *
 * @example
 * ```js
 * const { useStoreSelectors } = wp.data;
 *
 * function HammerPriceDisplay( { currency } ) {
 *   const price = useStoreSelectors(
 *     'my-shop',
 *     ( { getPrice } ) => getPrice( 'hammer', currency ),
 *     [ currency ]
 *   );
 *   return new Intl.NumberFormat( 'en-US', {
 *     style: 'currency',
 *     currency,
 *   } ).format( price );
 * }
 *
 * // Rendered in the application:
 * // <HammerPriceDisplay currency="USD" />
 * ```
 *
 * In the above example, when `HammerPriceDisplay` is rendered into an
 * application, the price will be retrieved from the store state using the
 * `mapSelectors` callback on `useStoreSelectors`. If the currency prop changes then
 * any price in the state for that currency is retrieved. If the currency prop
 * doesn't change and other props are passed in that do change, the price will
 * not change because the dependency is just the currency.
 *
 * @return {Function} A custom react hook.
 */
export default function useStoreSelectors( storeKey, mapSelectors, deps = [] ) {
	return useSelect( ( select ) => mapSelectors( select( storeKey ) ), deps );
}
