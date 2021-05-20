/**
 * External dependencies
 */
import { debounce } from 'lodash';
import { useMemoOne } from 'use-memo-one';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/* eslint-disable jsdoc/valid-types */
/**
 * Debounces a function with Lodash's `debounce`. A new debounced function will
 * be returned and any scheduled calls cancelled if any of the arguments change,
 * including the function to debounce, so please wrap functions created on
 * render in components in `useCallback`.
 *
 * @see https://docs-lodash.com/v4/debounce/
 *
 * @template {(...args: any[]) => void} TFunc
 *
 * @param {TFunc} fn The function to debounce.
 * @param {number} [wait] The number of milliseconds to delay.
 * @param {import('lodash').DebounceSettings} [options] The options object.
 * @return {TFunc & import('lodash').Cancelable} Debounced function.
 */
export default function useDebounce( fn, wait, options ) {
	/* eslint-enable jsdoc/valid-types */
	const debounced = useMemoOne( () => debounce( fn, wait, options ), [
		fn,
		wait,
		options,
	] );
	useEffect( () => () => debounced.cancel(), [ debounced ] );
	return debounced;
}
