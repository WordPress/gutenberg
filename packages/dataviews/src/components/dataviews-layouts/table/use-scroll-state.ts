import type { RefObject } from 'react';
import { useEffect, useState } from '@wordpress/element';

/**
 * A hook to track the scroll state of a container element.
 *
 * Returns whether the container has been scrolled vertically (for sticky header
 * styling), and whether there are columns to scroll to before and after the
 * visible ones (for the table's scroll fades): the cue at the start shows from
 * the first pixel scrolled, and the one at the end until the last pixel.
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
} ): {
	hasVerticalScrollStart: boolean;
	hasHorizontalScrollStart: boolean;
	hasHorizontalScrollEnd: boolean;
} {
	const [ hasVerticalScrollStart, setHasVerticalScrollStart ] =
		useState( false );
	const [ hasHorizontalScrollStart, setHasHorizontalScrollStart ] =
		useState( false );
	const [ hasHorizontalScrollEnd, setHasHorizontalScrollEnd ] =
		useState( false );

	useEffect( () => {
		const scrollContainer = scrollContainerRef.current;
		if ( ! scrollContainer ) {
			return;
		}

		const update = () => {
			setHasVerticalScrollStart( scrollContainer.scrollTop > 0 );

			// In RTL, `scrollLeft` runs from 0 down to negative values.
			const scrolled = Math.abs( scrollContainer.scrollLeft );
			const remaining =
				scrollContainer.scrollWidth -
				scrollContainer.clientWidth -
				scrolled;
			setHasHorizontalScrollStart( scrolled >= 1 );
			setHasHorizontalScrollEnd( remaining >= 1 );
		};

		update();
		scrollContainer.addEventListener( 'scroll', update );

		// Showing, hiding or loading columns changes how far the container
		// scrolls without firing `scroll`, and so does resizing it.
		let resizeObserver: ResizeObserver | undefined;
		if ( typeof ResizeObserver !== 'undefined' ) {
			resizeObserver = new ResizeObserver( update );
			resizeObserver.observe( scrollContainer );
			const table = scrollContainer.querySelector( 'table' );
			if ( table ) {
				resizeObserver.observe( table );
			}
		}

		return () => {
			scrollContainer.removeEventListener( 'scroll', update );
			resizeObserver?.disconnect();
		};
	}, [ scrollContainerRef ] );

	return {
		hasVerticalScrollStart,
		hasHorizontalScrollStart,
		hasHorizontalScrollEnd,
	};
}
