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
import { usePrevious } from '@wordpress/compose';

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
	const previousMapSelect = usePrevious( mapSelect );
	const result = useRef();
	const registry = useRegistry();
	const isAsync = useAsyncMode();
	const [ , dispatch ] = useState( {} );
	const rerender = () => dispatch( {} );
	const isMountedAndNotUnsubscribing = useRef( true );
	const previousMapError = useRef();
	const shouldSyncCompute =
		previousMapSelect !== mapSelect || !! previousMapError.current;

	const atomState = useMemo( () => {
		return createDerivedAtom(
			( { get } ) => {
				const current = registry.__unstableGetAtomResolver();
				registry.__unstableSetAtomResolver( get );
				let ret;
				try {
					ret = mapSelect( registry.select, registry );
				} catch ( error ) {
					ret = result.current;
					previousMapError.current = error;
				}
				registry.__unstableSetAtomResolver( current );
				return ret;
			},
			() => {},
			isAsync
		)( registry.getAtomRegistry() );
	}, [ isAsync, registry, mapSelect ] );

	try {
		if ( shouldSyncCompute ) {
			result.current = atomState.get();
		}
	} catch ( error ) {
		let errorMessage = `An error occurred while running 'mapSelect': ${ error.message }`;
		if ( previousMapError.current ) {
			errorMessage += `\nThe error may be correlated with this previous error:\n`;
			errorMessage += `${ previousMapError.current.stack }\n\n`;
			errorMessage += 'Original stack trace:';

			throw new Error( errorMessage );
		} else {
			// eslint-disable-next-line no-console
			console.error( errorMessage );
		}
	}
	useLayoutEffect( () => {
		previousMapError.current = undefined;
		isMountedAndNotUnsubscribing.current = true;
	} );

	useLayoutEffect( () => {
		const onStoreChange = () => {
			if (
				isMountedAndNotUnsubscribing.current &&
				! isShallowEqual( atomState.get(), result.current )
			) {
				result.current = atomState.get();
				rerender();
			}
		};
		const unsubscribe = atomState.subscribe( () => {
			onStoreChange();
		} );

		// This is necessary if the value changes during mount.
		onStoreChange();

		return () => {
			isMountedAndNotUnsubscribing.current = false;
			unsubscribe();
		};
	}, [ atomState ] );

	return result.current;
}
