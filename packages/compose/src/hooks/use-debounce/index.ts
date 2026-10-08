import { useEffect, useMemo } from '@wordpress/element';
import { debounce } from '../../utils/debounce';
import type { DebounceOptions, DebouncedFunc } from '../../utils/debounce';
import useEvent from '../use-event';

/**
 * Debounces a function similar to Lodash's `debounce`. The latest version of the
 * function is always called, so it doesn't need to be wrapped in `useCallback`.
 * A new debounced function will be returned and any scheduled calls cancelled if
 * `wait` or `options` change.
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
	// Stable, so a new function doesn't cancel scheduled calls.
	const callback = useEvent( fn );
	const debounced = useMemo(
		() => debounce( callback, wait ?? 0, options ),
		// Depends on the individual options rather than the `options` object.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			callback,
			wait,
			options?.leading,
			options?.trailing,
			options?.maxWait,
		]
	);
	useEffect( () => () => debounced.cancel(), [ debounced ] );
	return debounced;
}
