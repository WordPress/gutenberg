/**
 * External dependencies
 */
import { throttle } from 'lodash';
import { useMemoOne } from 'use-memo-one';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/* eslint-disable jsdoc/valid-types */
/**
 * Throttles a function with Lodash's `throttle`. A new throttled function will
 * be returned and any scheduled calls cancelled if any of the arguments change,
 * including the function to throttle, so please wrap functions created on
 * render in components in `useCallback`.
 *
 * @template {(...args: any[]) => any} T
 * @type {(func: T, wait?: number, options?: import('lodash').ThrottleSettings) => T & import('lodash').Cancelable}
 */
export default function useThrottle( ...args ) {
	const throttled = useMemoOne( () => throttle( ...args ), args );
	useEffect( () => () => throttled.cancel(), [ throttled ] );
	return throttled;
}
/* eslint-enable jsdoc/valid-types */
