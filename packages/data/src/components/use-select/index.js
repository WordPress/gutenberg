/**
 * WordPress dependencies
 */
import {
	useLayoutEffect,
	useRef,
	useState,
	useMemo,
	useCallback,
} from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';
import { createDerivedAtom } from '@wordpress/stan';

/**
 * Internal dependencies
 */
import useAsyncMode from '../async-mode-provider/use-async-mode';
import useRegistry from '../registry-provider/use-registry';

/**
 * Custom react hook for retrieving props from registered selectors.
 *
 * In general, this custom React hook follows the
 * [rules of hooks](https://reactjs.org/docs/hooks-rules.html).
 *
 * @param {Function} _mapSelect  Function called on every state change. The
 * returned value is exposed to the component
 * implementing this hook. The function receives
 * the `registry.select` method on the first
 * argument and the `registry` on the second
 * argument.
 * @param {Array} deps        If provided, this memoizes the mapSelect so the
 * same `mapSelect` is invoked on every state
 * change unless the dependencies change.
 * @example
 * ```js
 * const { useSelect } = wp.data;
 *
 * function HammerPriceDisplay( { currency } ) {
 * const price = useSelect( ( select ) => {
 * return select( 'my-shop' ).getPrice( 'hammer', currency )
 * }, [ currency ] );
 * return new Intl.NumberFormat( 'en-US', {
 * style: 'currency',
 * currency,
 * } ).format( price );
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
 * @return {Function}  A custom react hook.
 */
export default function useSelect( _mapSelect, deps ) {
	const mapSelect = useCallback( _mapSelect, deps );
	const previousMapSelect = useRef();
	const result = useRef();
	const registry = useRegistry();
	const isAsync = useAsyncMode();
	const [ , dispatch ] = useState( {} );
	const rerender = () => dispatch( {} );
	const isMountedAndNotUnsubscribing = useRef( true );
	if ( mapSelect !== previousMapSelect.current ) {
		// This makes sure initialization happens synchronously
		// whenever mapSelect changes.
		result.current = mapSelect( registry.select );
	}

	useLayoutEffect( () => {
		previousMapSelect.current = mapSelect;
		isMountedAndNotUnsubscribing.current = true;
	} );

	const atomCreator = useMemo( () => {
		return createDerivedAtom(
			( get ) => {
				const current = registry.__unstableGetAtomResolver();
				registry.__unstableSetAtomResolver( get );
				const ret = previousMapSelect.current( registry.select );
				registry.__unstableSetAtomResolver( current );
				return ret;
			},
			() => {},
			isAsync
		);
	}, [ isAsync, registry ] );

	useLayoutEffect( () => {
		const atom = atomCreator( registry.getAtomRegistry() );

		const onStoreChange = () => {
			if (
				isMountedAndNotUnsubscribing.current &&
				! isShallowEqual( atom.get(), result.current )
			) {
				result.current = atom.get();
				rerender();
			}
		};
		const unsubscribe = atom.subscribe( () => {
			onStoreChange();
		} );

		// This is necessary
		// If the value changes during mount
		// It also important to run after "subscribe"
		// Otherwise the atom value won't be resolved.
		onStoreChange();

		return () => {
			isMountedAndNotUnsubscribing.current = false;
			unsubscribe();
		};
	}, [ atomCreator ] );

	return result.current;
}
