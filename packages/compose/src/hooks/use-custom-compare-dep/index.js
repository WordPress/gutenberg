/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Takes a value to be used as a dependency in a hooks dependency array
 * and a custom compare function and memoizes the value for as long
 * as the compare function dictates that it hasn't changed. This
 * lets you use non-primitives in hooks dependency arrays.
 *
 * @example
 * ```js
 * useMemo( expensiveComputation, [ useCustomCompareDep( mutableObject, _.isEqual ) ] );
 * ```
 *
 * @param {*}        value   Value to memoize.
 *
 * @param {Function} compare Custom compare function for diffing `value`.
 *
 * @return {*} The memoized `value`.
 */
export default function useCustomCompareDep( value, compare ) {
	const ref = useRef();

	if ( ! compare( value, ref.current ) ) {
		ref.current = value;
	}

	return ref.current;
}

/**
 * Takes a value to be used as a dependency in a hooks dependency array
 * and memoizes it for as long as it is shallowly unchanged.
 * This lets you use non-primitives in hooks dependency arrays.
 *
 * @example
 * ```js
 * useMemo( expensiveComputation, [ useShallowCompareDep( shallowlyMutableObject ) ] );
 * ```
 *
 * @param {*} value Value to memoize.
 *
 * @return {*} The memoized `value`.
 */
export function useShallowCompareDep( value ) {
	return useCustomCompareDep( value, isShallowEqual );
}

/**
 * Takes a value to be used as a dependency in a hooks dependency array
 * and memoizes it for as long as it is deeply unchanged.
 * This lets you use non-primitives in hooks dependency arrays.
 *
 * @example
 * ```js
 * useMemo( expensiveComputation, [ useDeepCompareDep( deeplyMutableObject ) ] );
 * ```
 *
 * @param {*} value Value to memoize.
 *
 * @return {*} The memoized `value`.
 */
export function useDeepCompareDep( value ) {
	return useCustomCompareDep( value, isEqual );
}
