import { useResizeObserver } from '@wordpress/compose';
import { useState } from '@wordpress/element';

// Sub-pixel rounding can leave scrollWidth a hair over clientWidth on text
// that fully fits.
const FIT_TOLERANCE = 1;

/**
 * Whether a single-line element clips its text. Returns the ref to observe
 * and the current answer.
 */
export function useIsTruncated< T extends HTMLElement >(): [
	( element?: T | null ) => void,
	boolean,
] {
	const [ isTruncated, setIsTruncated ] = useState( false );

	const measureRef = useResizeObserver< T >( ( [ { target } ] ) =>
		setIsTruncated(
			target.scrollWidth - target.clientWidth > FIT_TOLERANCE
		)
	);

	return [ measureRef, isTruncated ];
}
