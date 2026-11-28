import { useRefEffect } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';
import type { RefObject } from 'react';

const scrollContainerCache = new WeakMap< Element, Element | undefined >();

/**
 * Allow scrolling "through" popovers over the canvas. This is only called for
 * as long as the pointer is over a popover. Do not use React events because it
 * will bubble through portals.
 *
 * @param contentRef
 */
function usePopoverScroll( contentRef?: RefObject< HTMLElement | null > ) {
	const effect = useRefEffect< HTMLElement >(
		( node ) => {
			function onWheel( event: WheelEvent ) {
				const { deltaX, deltaY, target } = event;
				// The ref is only attached when `contentRef` is set, see below.
				const contentEl = contentRef!.current!;
				let scrollContainer = scrollContainerCache.get( contentEl );
				if ( ! scrollContainer ) {
					scrollContainer = getScrollContainer( contentEl );
					scrollContainerCache.set( contentEl, scrollContainer );
				}
				// Finds a scrollable ancestor of the event’s target. It's not cached because the
				// it may not remain scrollable due to popover position changes. The cache is also
				// less likely to be utilized because the target may be different every event.
				// Wheel events target elements.
				const eventScrollContainer = getScrollContainer(
					target as Element
				);
				// Scrolls “through” the popover only if another contained scrollable area isn’t
				// in front of it. This is to avoid scrolling both containers simultaneously.
				// `contains` treats `undefined` as `null`.
				if ( ! node.contains( eventScrollContainer as Node | null ) ) {
					// The canvas content always sits in a scroll container.
					scrollContainer!.scrollBy( deltaX, deltaY );
				}
			}
			// Tell the browser that we do not call event.preventDefault
			// See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#improving_scrolling_performance_with_passive_listeners
			const options: AddEventListenerOptions = { passive: true };
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
