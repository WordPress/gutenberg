import type { RefObject } from 'react';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useState,
} from '@wordpress/element';
import { useEvent, useResizeObserver } from '@wordpress/compose';

// `scrollLeft` is negative in RTL, so its absolute value is the distance
// scrolled from the start in both directions.
const isScrolledToEnd = ( element: Element ) =>
	Math.abs( element.scrollLeft ) + element.clientWidth >=
	element.scrollWidth - 1;

/**
 * A hook to track the scroll state of a container element.
 *
 * Returns whether the container has been scrolled vertically (for sticky header styling)
 * and whether it has reached the horizontal scroll end (for the sticky actions column
 * and the scroll fade).
 *
 * The state is measured again when the container or the scrolled content resizes, so
 * attach the returned `scrollContentRef` to the element that scrolls inside the container.
 *
 * The current way receives "refs" as arguments, but it lacks a mechanism to detect when a ref has changed.
 * As a result, when the "ref" is updated and attached to a new div, the computation should trigger again.
 * However, this isn't possible in the current setup because the hook is unaware that the ref has changed.
 *
 * See https://github.com/Automattic/wp-calypso/pull/103005#discussion_r2077567912.
 *
 * @param params                    The parameters for the hook.
 * @param params.scrollContainerRef The ref to the scroll container element.
 * @param [params.onResize]         Called after the container or the scrolled content resizes.
 * @return  The scroll state, and the ref to attach to the scrolled content.
 */
export function useScrollState( {
	scrollContainerRef,
	onResize,
}: {
	scrollContainerRef: RefObject< HTMLDivElement | null >;
	onResize?: () => void;
} ): {
	isHorizontalScrollEnd: boolean;
	isVerticallyScrolled: boolean;
	scrollContentRef: ( element?: Element | null ) => void;
} {
	const [ isHorizontalScrollEnd, setIsHorizontalScrollEnd ] =
		useState( false );
	const [ isVerticallyScrolled, setIsVerticallyScrolled ] = useState( false );

	const handleScroll = useCallback( () => {
		const scrollContainer = scrollContainerRef.current;
		if ( ! scrollContainer ) {
			return;
		}

		setIsHorizontalScrollEnd( isScrolledToEnd( scrollContainer ) );
		setIsVerticallyScrolled( scrollContainer.scrollTop > 0 );
	}, [ scrollContainerRef ] );

	const handleResize = useEvent( () => {
		handleScroll();
		onResize?.();
	} );
	const scrollContentRef = useResizeObserver( handleResize );
	const scrollContainerResizeRef = useResizeObserver( handleResize );

	// Measure before the first paint, so the scroll cues don't flash.
	useLayoutEffect( handleResize, [ handleResize ] );

	useEffect( () => {
		const scrollContainer = scrollContainerRef.current;
		if ( ! scrollContainer ) {
			return () => {};
		}

		scrollContainer.addEventListener( 'scroll', handleScroll );
		scrollContainerResizeRef( scrollContainer );

		return () => {
			scrollContainer.removeEventListener( 'scroll', handleScroll );
			scrollContainerResizeRef( null );
		};
	}, [ scrollContainerRef, handleScroll, scrollContainerResizeRef ] );

	return { isHorizontalScrollEnd, isVerticallyScrolled, scrollContentRef };
}
