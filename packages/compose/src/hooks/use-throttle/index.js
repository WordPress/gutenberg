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

/**
 * Throttles a function similar to Lodash's `throttle`. A new throttled function will
 * be returned and any scheduled calls cancelled if any of the arguments change,
 * including the function to throttle, so please wrap functions created on
 * render in components in `useCallback`.
 *
 * @see https://docs-lodash.com/v4/throttle/
 *
 * @template {(...args: any[]) => void} TFunc
 *
 * @param {TFunc}                                          fn        The function to throttle.
 * @param {number}                                         [wait]    The number of milliseconds to throttle invocations to.
 * @param {import('../../utils/throttle').ThrottleOptions} [options] The options object. See linked documentation for details.
 * @return {import('../../utils/debounce').DebouncedFunc<TFunc>} Throttled function.
 */
export default function useThrottle( fn, wait, options ) {
	const throttled = useMemoOne(
		() => throttle( fn, wait ?? 0, options ),
		[ fn, wait, options ]
	);
	useEffect( () => () => throttled.cancel(), [ throttled ] );
	return throttled;
}
