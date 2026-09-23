import { useCallback, useState } from '@wordpress/element';
import { useMergeRefs, useResizeObserver } from '@wordpress/compose';

/**
 * Tracks the width of the element the returned ref is attached to.
 *
 * The element is measured as soon as it attaches, during the commit phase, so
 * the first paint already knows its width. A resize observer alone reports
 * only after that first paint, which leaves a frame rendered at width `0`: the
 * grid layout derives its column count from this width, so it lays every item
 * out in a single full-width column before snapping to the real one.
 *
 * The observer then keeps the width current as the element resizes.
 *
 * @return The element's width, and the ref to attach to it.
 */
export default function useContainerWidth< T extends HTMLElement >(): [
	number,
	( element?: T | null ) => void,
] {
	const [ width, setWidth ] = useState( 0 );

	// `offsetWidth` rather than `getBoundingClientRect()`: both are border-box
	// widths, matching what the observer reports, but `offsetWidth` ignores any
	// transform an ancestor may be animating with.
	const measureRef = useCallback( ( element?: T | null ) => {
		if ( element ) {
			setWidth( element.offsetWidth );
		}
	}, [] );

	const observerRef = useResizeObserver< T >(
		( entries ) => {
			setWidth( entries[ 0 ].borderBoxSize[ 0 ].inlineSize );
		},
		{ box: 'border-box' }
	);

	return [ width, useMergeRefs( [ measureRef, observerRef ] ) ];
}
