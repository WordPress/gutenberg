/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';
import { useRef } from '@wordpress/element';

export default function useScrollGesture( { onScrollUp, onScrollDown } ) {
	const scrollContainer = useRef();
	const lastScrollContainerPosition = useRef();
	const lastDirection = useRef();

	return useRefEffect( ( node ) => {
		function revealOnScroll( { deltaY } ) {
			if ( ! scrollContainer.current ) {
				scrollContainer.current = getScrollContainer( node );
				if ( scrollContainer.current ) {
					lastScrollContainerPosition.current =
						scrollContainer.current.scrollTop;
				}
			}

			// Check that the element's scroll container was scrolled.
			if (
				scrollContainer.current &&
				lastScrollContainerPosition.current !==
					scrollContainer.scrollTop
			) {
				if ( deltaY > 0 && lastDirection.current !== 'down' ) {
					lastDirection.current = 'down';
					onScrollDown( node );
				}

				if ( deltaY < 0 && lastDirection.current !== 'up' ) {
					lastDirection.current = 'up';
					onScrollUp( node );
				}
			}
		}

		if ( node ) {
			node.ownerDocument.addEventListener( 'wheel', revealOnScroll );
		}

		return () => {
			if ( node ) {
				node.ownerDocument.removeEventListener(
					'wheel',
					revealOnScroll
				);
			}
		};
	}, [] );
}
