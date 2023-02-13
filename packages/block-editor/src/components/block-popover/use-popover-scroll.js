/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';

/**
 * Allow scrolling "through" popovers over the canvas. This is only called for
 * as long as the pointer is over a popover. Do not use React events because it
 * will bubble through portals.
 *
 * @param {Object} scrollableRef
 */
function usePopoverScroll( scrollableRef ) {
	return useRefEffect(
		( node ) => {
			if ( ! scrollableRef ) {
				return;
			}

			function onWheel( event ) {
				const { deltaX, deltaY } = event;
				const scrollContainer = getScrollContainer(
					scrollableRef.current
				);
				const { ownerDocument } = scrollContainer;
				const { defaultView } = ownerDocument;
				const windowScroll =
					scrollContainer === ownerDocument.body ||
					scrollContainer === ownerDocument.documentElement;
				scrollableRef.current.scrollBy( deltaX, deltaY );

				if ( windowScroll ) {
					defaultView.scrollBy( 0, deltaY );
				} else {
					scrollContainer.scrollLeft += deltaX;
					scrollContainer.scrollTop += deltaY;
				}

				event.preventDefault();
			}
			node.addEventListener( 'wheel', onWheel );
			return () => {
				node.removeEventListener( 'wheel', onWheel );
			};
		},
		[ scrollableRef ]
	);
}

export default usePopoverScroll;
