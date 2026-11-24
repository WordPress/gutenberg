import { useResizeObserver } from '@wordpress/compose';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

// Adapted from the private hook behind `Breadcrumb.CurrentItem` in
// packages/ui/src/breadcrumb/use-is-truncated.ts.

// Sub-pixel noise; a real clip is at least a glyph.
const FIT_TOLERANCE = 0.05;

// How far the text extends beyond the element, in px. `scrollWidth` and
// `clientWidth` are integers and miss a clip under 1px that the browser
// already ellipsizes. jsdom has no `Range` geometry.
function measureOverflow( element: HTMLElement ) {
	const range = element.ownerDocument.createRange();
	range.selectNodeContents( element );
	return typeof range.getBoundingClientRect === 'function'
		? range.getBoundingClientRect().width -
				element.getBoundingClientRect().width
		: element.scrollWidth - element.clientWidth;
}

/**
 * Whether a single-line element clips its text: the ref to observe, the
 * answer, then how many pixels of text are clipped.
 *
 * @param reclaim Width a control shown only while clipped gives back, so it
 *                cannot keep the text clipped.
 */
export function useIsTruncated< T extends HTMLElement >(
	reclaim = 0
): [ ( element?: T | null ) => void, boolean, number ] {
	const [ element, setElement ] = useState< T | null >( null );
	const [ isTruncated, setIsTruncated ] = useState( false );
	const [ overflow, setOverflow ] = useState( 0 );

	// The observer reads these between renders.
	const isTruncatedRef = useRef( false );
	const reclaimRef = useRef( reclaim );

	const update = useCallback( ( target: HTMLElement ) => {
		const measured = measureOverflow( target );
		const slack = isTruncatedRef.current ? reclaimRef.current : 0;
		const next = measured > slack + FIT_TOLERANCE;
		isTruncatedRef.current = next;
		setIsTruncated( next );
		setOverflow( Math.max( 0, measured ) );
	}, [] );

	const observeRef = useResizeObserver< T >( ( [ { target } ] ) =>
		update( target as HTMLElement )
	);
	const measureRef = useCallback(
		( node?: T | null ) => {
			setElement( node ?? null );
			observeRef( node );
		},
		[ observeRef ]
	);

	useEffect( () => {
		reclaimRef.current = reclaim;
		if ( element ) {
			update( element );
		}
	}, [ element, reclaim, update ] );

	// A web font can widen the text without resizing the element's box.
	useEffect( () => {
		if ( ! element || ! document.fonts ) {
			return;
		}
		let isActive = true;
		document.fonts.ready.then( () => {
			if ( isActive ) {
				update( element );
			}
		} );
		return () => {
			isActive = false;
		};
	}, [ element, update ] );

	return [ measureRef, isTruncated, overflow ];
}
