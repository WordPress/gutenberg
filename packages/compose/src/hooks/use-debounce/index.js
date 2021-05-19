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
 * @template T
 * @typedef {T extends [any, ...infer R] ? R : never} TailParameters
 */

// We want to keep the type of the function that is passed in but the rest we don't
// really care about, so this allows us to ignore the details of the rest of the paramters
// while still maintaining the proper generic type for `debounce` where the returned
// function matchest the signature of the passed in function.
/** @typedef {TailParameters<Parameters<typeof debounce>>} DebounceTailParameters */

/**
 * Debounces a function with Lodash's `debounce`. A new debounced function will
 * be returned and any scheduled calls cancelled if any of the arguments change,
 * including the function to debounce, so please wrap functions created on
 * render in components in `useCallback`.
 *
 * @template {(...args: any[]) => void} TFunc
 * @param {[TFunc, ...DebounceTailParameters]} args Arguments passed to Lodash's `debounce`.
 *
 * @return {TFunc & import('lodash').Cancelable} Debounced function.
 */
export default function useDebounce( ...args ) {
	/* eslint-enable jsdoc/valid-types */
	const debounced = useMemoOne( () => debounce( ...args ), args );
	useEffect( () => () => debounced.cancel(), [ debounced ] );
	return debounced;
}
