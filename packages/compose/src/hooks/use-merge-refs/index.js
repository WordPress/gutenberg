/**
 * WordPress dependencies
 */
import { useRef, useCallback } from '@wordpress/element';

/** @typedef {import('@wordpress/element').RefObject} RefObject */
/** @typedef {import('@wordpress/element').RefCallback} RefCallback */

/**
 * Merges refs into one ref callback. Ensures the merged ref callbacks are only
 * called when it changes or when the ref value changes. If you don't wish a ref
 * callback to be called on every render, wrap it with `useCallback( ref, [] )`.
 * Dependencies can be added, but when a dependency changes, the ref callback
 * will be called with the same node.
 *
 * @param {Array<RefObject|RefCallback>} refs The refs to be merged.
 */
export default function useMergeRefs( refs ) {
	const lastValue = useRef( null );
	const lastRefs = useRef( refs );

	return useCallback( ( value ) => {
		refs.forEach( ( ref, index ) => {
			if ( typeof ref === 'function' ) {
				// Only call a ref when it wants to be called:
				// - The value changes.
				// - The ref callback has changed (e.g. an updated dependency).
				if (
					value !== lastValue.current ||
					lastRefs[ index ] !== ref
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
