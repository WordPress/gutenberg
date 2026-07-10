/**
 * External dependencies
 */
import { useMemoOne } from 'use-memo-one';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { throttle } from '../../utils/throttle';
import type { ThrottleOptions } from '../../utils/throttle';
import type { DebouncedFunc } from '../../utils/debounce';

/**
 * Throttles a function similar to Lodash's `throttle`. A new throttled function will
 * be returned and any scheduled calls cancelled if any of the arguments change,
 * including the function to throttle, so please wrap functions created on
 * render in components in `useCallback`.
 *
 * @see https://lodash.com/docs/4#throttle
 *
 * @template TFunc
 *
 * @param    fn      The function to throttle.
 * @param    wait    The number of milliseconds to throttle invocations to.
 * @param    options The options object.
 * @return          Throttled function.
 */
export default function useThrottle< TFunc extends ( ...args: any[] ) => void >(
	fn: TFunc,
	wait?: number,
	options?: ThrottleOptions
): DebouncedFunc< TFunc > {
	const throttled = useMemoOne(
		() => throttle( fn, wait ?? 0, options ),
		[ fn, wait, options ]
	);
	useEffect( () => () => throttled.cancel(), [ throttled ] );
	return throttled;
}
