import { useResizeObserver } from '@wordpress/compose';
import { useCallback, useEffect, useState } from '@wordpress/element';

// Mirrors the private hook behind `Breadcrumb.CurrentItem` in
// packages/ui/src/breadcrumb/use-is-truncated.ts.

// Sub-pixel rounding can leave scrollWidth a hair over clientWidth on text
// that fully fits.
const FIT_TOLERANCE = 1;

function measure( element: HTMLElement ) {
	return element.scrollWidth - element.clientWidth > FIT_TOLERANCE;
}

/**
 * Whether a single-line element clips its text. Returns the ref to observe
 * and the current answer.
 */
export function useIsTruncated< T extends HTMLElement >(): [
	( element?: T | null ) => void,
	boolean,
] {
	const [ element, setElement ] = useState< T | null >( null );
	const [ isTruncated, setIsTruncated ] = useState( false );

	const observeRef = useResizeObserver< T >( ( [ { target } ] ) =>
		setIsTruncated( measure( target as HTMLElement ) )
	);
	const measureRef = useCallback(
		( node?: T | null ) => {
			setElement( node ?? null );
			observeRef( node );
		},
		[ observeRef ]
	);

	// A web font can widen the text without resizing the element's box.
	useEffect( () => {
		if ( ! element || ! document.fonts ) {
			return;
		}
		let isActive = true;
		document.fonts.ready.then( () => {
			if ( isActive ) {
				setIsTruncated( measure( element ) );
			}
		} );
		return () => {
			isActive = false;
		};
	}, [ element ] );

	return [ measureRef, isTruncated ];
}
