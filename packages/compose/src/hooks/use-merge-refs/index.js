/**
 * WordPress dependencies
 */
import { useRef, useCallback } from '@wordpress/element';

/** @typedef {import('@wordpress/element').RefObject} RefObject */
/** @typedef {import('@wordpress/element').RefCallback} RefCallback */

/**
 * Merges refs into one ref callback. Ensures the merged ref callbacks are only
 * called when it changes (as a result of a `useCallback` dependency update) or
 * when the ref value changes. If you don't wish a ref callback to be called on
 * every render, wrap it with `useCallback( ref, [] )`.
 * Dependencies can be added, but when a dependency changes, the old ref
 * callback will be called with `null` and the new ref callback will be called
 * with the same node.
 *
 * @param {Array<RefObject|RefCallback>} refs The refs to be merged.
 *
 * @return {RefCallback} The merged ref callback.
 */
export default function useMergeRefs( refs ) {
	const lastValue = useRef( null );
	const lastRefs = useRef( refs );

	return useCallback( ( value ) => {
		refs.forEach( ( ref, index ) => {
			if ( typeof ref === 'function' ) {
				// Only call a ref callback if it has changes, e.g. a dependency
				// change in `useCallback`, EXCEPT if the value changes, then
				// the ref callback must always be called.
				// Any other ref callbacks WON'T be called if it doesn't change,
				// e.g. if no `useCallback` dependencies change.
				if (
					lastRefs[ index ] !== ref ||
					value !== lastValue.current
				) {
					ref( value );
				}
			} else if ( ref && ref.hasOwnProperty( 'current' ) ) {
				ref.current = value;
			}
		} );

		lastValue.current = value;
		lastRefs.current = refs;
	}, refs );
}
