import type { RefObject } from 'react';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

const isScrolledToEnd = ( element: Element ) => {
	if ( isRTL() ) {
		const scrollLeft = Math.abs( element.scrollLeft );
		return scrollLeft <= 1;
	}

	return element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;
};

/**
 * Whether the container is at the start of the horizontal scroll range.
 *
 * `Math.abs` because RTL scrolls negative from zero, the same reason
 * `isScrolledToEnd` special-cases it. A one-pixel tolerance avoids a divider
 * flickering on sub-pixel scroll positions.
 *
 * @param element The scroll container.
 * @return Whether the container is at the horizontal scroll start.
 */
const isScrolledToStart = ( element: Element ) =>
	Math.abs( element.scrollLeft ) <= 1;

/**
 * A hook to track the scroll state of a container element.
 *
 * Returns whether the container has been scrolled vertically (for sticky header styling)
 * and whether it is at the horizontal scroll start (for sticky first column styling) or
 * end (for sticky actions column styling).
 *
 * The current way receives "refs" as arguments, but it lacks a mechanism to detect when a ref has changed.
 * As a result, when the "ref" is updated and attached to a new div, the computation should trigger again.
 * However, this isn't possible in the current setup because the hook is unaware that the ref has changed.
 *
 * See https://github.com/Automattic/wp-calypso/pull/103005#discussion_r2077567912.
 *
 * @param params                           The parameters for the hook.
 * @param params.scrollContainerRef        The ref to the scroll container element.
 * @param [params.enabledHorizontal=false] Whether to track horizontal scroll start and end.
 * @return  The scroll state.
 */
export function useScrollState( {
	scrollContainerRef,
	enabledHorizontal = false,
}: {
	scrollContainerRef: RefObject< HTMLDivElement | null >;
	enabledHorizontal?: boolean;
} ): {
	isHorizontalScrollStart: boolean;
	isHorizontalScrollEnd: boolean;
	isVerticallyScrolled: boolean;
} {
	const [ isHorizontalScrollStart, setIsHorizontalScrollStart ] =
		useState( true );
	const [ isHorizontalScrollEnd, setIsHorizontalScrollEnd ] =
		useState( false );
	const [ isVerticallyScrolled, setIsVerticallyScrolled ] = useState( false );

	const handleScroll = useCallback( () => {
		const scrollContainer = scrollContainerRef.current;
		if ( ! scrollContainer ) {
			return;
		}

		if ( enabledHorizontal ) {
			setIsHorizontalScrollStart( isScrolledToStart( scrollContainer ) );
			setIsHorizontalScrollEnd( isScrolledToEnd( scrollContainer ) );
		}

		setIsVerticallyScrolled( scrollContainer.scrollTop > 0 );
	}, [ scrollContainerRef, enabledHorizontal ] );
	useEffect( () => {
		if ( typeof window === 'undefined' || ! scrollContainerRef.current ) {
			return () => {};
		}

		const scrollContainer = scrollContainerRef.current;

		handleScroll();
		scrollContainer.addEventListener( 'scroll', handleScroll );
		window.addEventListener( 'resize', handleScroll );

		return () => {
			scrollContainer.removeEventListener( 'scroll', handleScroll );
			window.removeEventListener( 'resize', handleScroll );
		};
	}, [ scrollContainerRef, enabledHorizontal, handleScroll ] );

	return {
		isHorizontalScrollStart,
		isHorizontalScrollEnd,
		isVerticallyScrolled,
	};
}
