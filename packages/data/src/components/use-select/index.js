/**
 * WordPress dependencies
 */
import { useLayoutEffect, useRef, useState, useMemo } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';
import { createDerivedAtom } from '../../atom';

/**
 * Custom react hook for retrieving props from registered selectors.
 *
 * In general, this custom React hook follows the
 * [rules of hooks](https://reactjs.org/docs/hooks-rules.html).
 *
 * @param {Function} _mapSelect  Function called on every state change. The
 *                               returned value is exposed to the component
 *                               implementing this hook. The function receives
 *                               the `registry.select` method on the first
 *                               argument and the `registry` on the second
 *                               argument.
 * @param {Array}    deps        If provided, this memoizes the mapSelect so the
 *                               same `mapSelect` is invoked on every state
 *                               change unless the dependencies change.
 *
 * @example
 * ```js
 * const { useSelect } = wp.data;
 *
 * function HammerPriceDisplay( { currency } ) {
 *   const price = useSelect( ( select ) => {
 *     return select( 'my-shop' ).getPrice( 'hammer', currency )
 *   }, [ currency ] );
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
 * `mapSelect` callback on `useSelect`. If the currency prop changes then
 * any price in the state for that currency is retrieved. If the currency prop
 * doesn't change and other props are passed in that do change, the price will
 * not change because the dependency is just the currency.
 *
 * @return {Function}  A custom react hook.
 */
export default function useSelect( _mapSelect, deps = [] ) {
	const registry = useRegistry();
	const initialResult = _mapSelect( registry.select );
	const [ , dispatch ] = useState( {} );
	const rerender = () => dispatch( {} );
	const result = useRef( initialResult );

	const mapSelect = useRef( _mapSelect );
	useLayoutEffect( () => {
		mapSelect.current = _mapSelect;
	} );

	const atomCreator = useMemo( () => {
		return createDerivedAtom( ( get ) => {
			return mapSelect.current( ( storeKey ) => {
				return get( registry.getAtomSelectors( storeKey ) );
			} );
		} );
	}, [ registry, ...deps ] );

	useLayoutEffect( () => {
		const atom = atomCreator( registry.atomRegistry );
		return atom.subscribe( () => {
			if ( ! isShallowEqual( atom.get(), result.current ) ) {
				result.current = atom.get();
				rerender();
			}
		} );
	}, [ atomCreator ] );

	return result.current;
}
