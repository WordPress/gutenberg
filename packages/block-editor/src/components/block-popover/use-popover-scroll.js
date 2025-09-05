/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';

const scrollContainerCache = new WeakMap();

/**
 * Allow scrolling "through" popovers over the canvas. This is only called for
 * as long as the pointer is over a popover. Do not use React events because it
 * will bubble through portals.
 *
 * @param {Object} contentRef
 */
function usePopoverScroll( contentRef ) {
	const effect = useRefEffect(
		( node ) => {
			function onWheel( event ) {
				const { deltaX, deltaY } = event;
				const contentEl = contentRef.current;
				let scrollContainer = scrollContainerCache.get( contentEl );
				if ( ! scrollContainer ) {
					scrollContainer = getScrollContainer( contentEl );
					scrollContainerCache.set( contentEl, scrollContainer );
				}
				scrollContainer.scrollBy( deltaX, deltaY );
			}
			// Tell the browser that we do not call event.preventDefault
			// See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#improving_scrolling_performance_with_passive_listeners
			const options = { passive: true };
			node.addEventListener( 'wheel', onWheel, options );
			return () => {
				node.removeEventListener( 'wheel', onWheel, options );
			};
		},
		[ contentRef ]
	);
	return contentRef ? effect : null;
}

export default usePopoverScroll;
