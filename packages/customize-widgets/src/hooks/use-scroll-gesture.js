/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';
import { useRef } from '@wordpress/element';

export default function useScrollGesture( { onScrollUp, onScrollDown } ) {
	const scrollContainer = useRef();
	const lastScrollContainerPosition = useRef();

	return useRefEffect( ( node ) => {
		function onWheel( event ) {
			if ( ! scrollContainer.current ) {
				scrollContainer.current = getScrollContainer( node );
				if ( scrollContainer.current ) {
					lastScrollContainerPosition.current =
						scrollContainer.current.scrollTop;
				}
			}

			// Check that it was the element's scroll container
			// that was scrolled.
			if (
				scrollContainer.current &&
				lastScrollContainerPosition.current !==
					scrollContainer.scrollTop
			) {
				const { deltaY } = event;
				if ( deltaY > 0 ) {
					onScrollDown( event, node );
				}

				if ( deltaY < 0 ) {
					onScrollUp( event, node );
				}
			}
		}

		if ( node ) {
			node.ownerDocument.addEventListener( 'wheel', onWheel );
		}

		return () => {
			if ( node ) {
				node.ownerDocument.removeEventListener( 'wheel', onWheel );
			}
		};
	}, [] );
}
