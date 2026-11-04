import { useCallback, useState } from '@wordpress/element';
import { useMergeRefs, useResizeObserver } from '@wordpress/compose';

/**
 * Tracks the width of the element the returned ref is attached to.
 *
 * The element is measured when it attaches, so a width is available for the
 * first paint. The resize observer keeps the width up to date from then on.
 *
 * Detaching leaves the last width in place; reattaching measures again.
 *
 * @return The element's width, and the ref to attach to it.
 */
export default function useContainerWidth< T extends HTMLElement >(): [
	number,
	( element?: T | null ) => void,
] {
	const [ width, setWidth ] = useState( 0 );

	// `inlineSize` is only available on an observer entry, so it can't be read
	// here. `offsetWidth` reports the same border box and, like
	// `borderBoxSize`, is unaffected by transforms.
	const measureRef = useCallback( ( element?: T | null ) => {
		if ( element ) {
			setWidth( element.offsetWidth );
		}
	}, [] );

	const observerRef = useResizeObserver< T >(
		( entries ) => {
			setWidth(
				Math.floor( entries[ 0 ].borderBoxSize[ 0 ].inlineSize )
			);
		},
		{ box: 'border-box' }
	);

	return [ width, useMergeRefs( [ measureRef, observerRef ] ) ];
}
