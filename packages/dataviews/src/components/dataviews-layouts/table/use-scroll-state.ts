import type { RefObject } from 'react';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * A hook to track the scroll state of a container element.
 *
 * Returns whether the container has been scrolled vertically (for sticky header styling).
 * The horizontal scroll cues of the table are handled in CSS.
 *
 * The current way receives "refs" as arguments, but it lacks a mechanism to detect when a ref has changed.
 * As a result, when the "ref" is updated and attached to a new div, the computation should trigger again.
 * However, this isn't possible in the current setup because the hook is unaware that the ref has changed.
 *
 * See https://github.com/Automattic/wp-calypso/pull/103005#discussion_r2077567912.
 *
 * @param params                    The parameters for the hook.
 * @param params.scrollContainerRef The ref to the scroll container element.
 * @return  The scroll state.
 */
export function useScrollState( {
	scrollContainerRef,
}: {
	scrollContainerRef: RefObject< HTMLDivElement | null >;
} ): { isVerticallyScrolled: boolean } {
	const [ isVerticallyScrolled, setIsVerticallyScrolled ] = useState( false );

	const handleScroll = useCallback( () => {
		const scrollContainer = scrollContainerRef.current;
		if ( ! scrollContainer ) {
			return;
		}

		setIsVerticallyScrolled( scrollContainer.scrollTop > 0 );
	}, [ scrollContainerRef ] );
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
	}, [ scrollContainerRef, handleScroll ] );

	return { isVerticallyScrolled };
}
