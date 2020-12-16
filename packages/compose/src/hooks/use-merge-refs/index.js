/**
 * WordPress dependencies
 */
import { useRef, useCallback } from '@wordpress/element';

/**
 * Merges refs.
 *
 * @param {Array} refs
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
			} else if ( ref ) {
				ref.current = value;
			}
		} );

		lastValue.current = value;
		lastRefs.current = refs;
	}, refs );
}
