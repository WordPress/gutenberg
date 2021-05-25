/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';

/**
 * Effect-like ref callback. Just like with `useEffect`, this allows you to
 * return a cleanup function to be run if the ref changes or one of the
 * dependencies changes. The ref is provided as an argument to the callback
 * functions. The main difference between this and `useEffect` is that
 * the `useEffect` callback is not called when the ref changes, but this is.
 * Pass the returned ref callback as the component's ref and merge multiple refs
 * with `useMergeRefs`.
 *
 * It's worth noting that if the dependencies array is empty, there's not
 * strictly a need to clean up event handlers for example, because the node is
 * to be removed. It *is* necessary if you add dependencies because the ref
 * callback will be called multiple times for the same node.
 *
 * @param {(node: HTMLElement) => (() => void) | undefined} callback Callback with ref as argument.
 * @param {import('react').DependencyList} dependencies Dependencies of the callback.
 *
 * @return {import('react').RefCallback<HTMLElement | null>} Ref callback.
 */
export default function useRefEffect( callback, dependencies ) {
	/** @type {import('react').MutableRefObject<(() => void) | undefined>}  */
	const cleanup = useRef();
	return useCallback( ( /** @type {HTMLElement | null} */ node ) => {
		if ( node ) {
			cleanup.current = callback( node );
		} else if ( cleanup.current ) {
			cleanup.current();
		}
	}, dependencies );
}
