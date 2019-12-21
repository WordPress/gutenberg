/**
 * WordPress dependencies
 */
import { createQueue } from '@wordpress/priority-queue';
import {
	useLayoutEffect,
	useRef,
	useMemo,
	useCallback,
	useEffect,
	useReducer,
} from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';
import useAsyncMode from '../async-mode-provider/use-async-mode';

/**
 * Favor useLayoutEffect to ensure the store subscription callback always has
 * the selector from the latest render. If a store update happens between render
 * and the effect, this could cause missed/stale updates or inconsistent state.
 *
 * Fallback to useEffect for server rendered components because currently React
 * throws a warning when using useLayoutEffect in that environment.
 */
const useIsomorphicLayoutEffect =
	typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const renderQueue = createQueue();

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
export default function useSelect( _mapSelect, deps ) {
	const mapSelect = useCallback( _mapSelect, deps );
	const registry = useRegistry();
	const isAsync = useAsyncMode();
	const queueContext = useMemo( () => ( { queue: true } ), [ registry ] );
	const [ , forceRender ] = useReducer( ( s ) => s + 1, 0 );

	const latestMapSelect = useRef();
	const latestIsAsync = useRef( isAsync );
	const latestMapOutput = useRef();
	const latestMapOutputError = useRef();
	const isMounted = useRef();

	let mapOutput;

	try {
		if ( latestMapSelect.current !== mapSelect || latestMapOutputError.current ) {
			mapOutput = mapSelect( registry.select, registry );
		} else {
			mapOutput = latestMapOutput.current;
		}
	} catch ( error ) {
		let errorMessage = `An error occurred while running 'mapSelect': ${
			error.message
		}`;

		if ( latestMapOutputError.current ) {
			errorMessage += `\nThe error may be correlated with this previous error:\n`;
			errorMessage += `${ latestMapOutputError.current.stack }\n\n`;
			errorMessage += 'Original stack trace:';

			throw new Error( errorMessage );
		}
	}

	useIsomorphicLayoutEffect( () => {
		latestMapSelect.current = mapSelect;
		if ( latestIsAsync.current !== isAsync ) {
			latestIsAsync.current = isAsync;
			renderQueue.flush( queueContext );
		}
		latestMapOutput.current = mapOutput;
		latestMapOutputError.current = undefined;
		isMounted.current = true;
	} );

	useIsomorphicLayoutEffect( () => {
		const onStoreChange = () => {
			if ( isMounted.current ) {
				try {
					const newMapOutput = latestMapSelect.current(
						registry.select,
						registry
					);
					if ( isShallowEqual( latestMapOutput.current, newMapOutput ) ) {
						return;
					}
					latestMapOutput.current = newMapOutput;
				} catch ( error ) {
					latestMapOutputError.current = error;
				}
				forceRender();
			}
		};

		// catch any possible state changes during mount before the subscription
		// could be set.
		if ( latestIsAsync.current ) {
			renderQueue.add( queueContext, onStoreChange );
		} else {
			onStoreChange();
		}

		const unsubscribe = registry.subscribe( () => {
			if ( latestIsAsync.current ) {
				renderQueue.add( queueContext, onStoreChange );
			} else {
				onStoreChange();
			}
		} );

		return () => {
			isMounted.current = false;
			unsubscribe();
			renderQueue.flush( queueContext );
		};
	}, [ registry ] );

	return mapOutput;
}
