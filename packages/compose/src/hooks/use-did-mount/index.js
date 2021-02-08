/**
 * WordPress dependencies
 */
import { useLayoutEffect, useRef } from '@wordpress/element';

/**
 * A drop-in replacement of the hook version of `componentDidMount`.
 * Like `useEffect` but only called once when the component is mounted.
 * This hook is only used for backward-compatibility reason. Consider using `useEffect` wherever possible.
 *
 * @param {Function} effect The effect callback passed to `useEffect`.
 */
function useDidMount( effect ) {
	const effectRef = useRef( effect );
	effectRef.current = effect;

	// `useLayoutEffect` because that's closer to how the `componentDidMount` works.
	useLayoutEffect( () => effectRef.current(), [] );
}

export default useDidMount;
