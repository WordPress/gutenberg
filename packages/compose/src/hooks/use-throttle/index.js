/**
 * External dependencies
 */
import { throttle } from 'lodash';
import { useMemoOne } from 'use-memo-one';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Throttles a function with Lodash's `throttle`. A new throttled function will
 * be returned and any scheduled calls cancelled if any of the arguments change,
 * including the function to throttle, so please wrap functions created on
 * render in components in `useCallback`.
 *
 * @param {...any} args Arguments passed to Lodash's `throttle`.
 *
 * @return {Function} Throttled function.
 */
export default function useThrottle( ...args ) {
	const throttled = useMemoOne( () => throttle( ...args ), args );
	useEffect( () => () => throttled.cancel(), [ throttled ] );
	return throttled;
}
