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
import { debounce } from '../../utils/debounce';
import type { DebounceOptions, DebouncedFunc } from '../../utils/debounce';

/**
 * Debounces a function similar to Lodash's `debounce`. A new debounced function will
 * be returned and any scheduled calls cancelled if any of the arguments change,
 * including the function to debounce, so please wrap functions created on
 * render in components in `useCallback`.
 *
 * @see https://lodash.com/docs/4#debounce
 *
 * @template TFunc
 *
 * @param    fn      The function to debounce.
 * @param    wait    The number of milliseconds to delay.
 * @param    options The options object.
 * @return          Debounced function.
 */
export default function useDebounce< TFunc extends ( ...args: any[] ) => void >(
	fn: TFunc,
	wait?: number,
	options?: DebounceOptions
): DebouncedFunc< TFunc > {
	const debounced = useMemoOne(
		() => debounce( fn, wait ?? 0, options ),
		[ fn, wait, options?.leading, options?.trailing, options?.maxWait ]
	);
	useEffect( () => () => debounced.cancel(), [ debounced ] );
	return debounced;
}
