/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Like `useEffect` but call the effect when the dependencies are not shallowly equal.
 * Useful when the size of the dependency array might change during re-renders.
 * This hook is only used for backward-compatibility reason. Consider using `useEffect` wherever possible.
 *
 * @param {Function} effect The effect callback passed to `useEffect`.
 * @param {Array}    deps   The dependency array that is compared against shallowly.
 */
function useShallowCompareEffect( effect, deps ) {
	const ref = useRef();

	if ( ! isShallowEqual( ref.current, deps ) ) {
		ref.current = deps;
	}

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect( effect, [ ref.current ] );
}

export default useShallowCompareEffect;
