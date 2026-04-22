import type { RefObject, UIEvent } from 'react';
import { useCallback, useLayoutEffect } from '@wordpress/element';

/*
 * Data attributes that advertise an overlay surface's scroll state to CSS (e.g.
 * dialog popups, drawers). Sticky header/footer chrome uses descendant
 * selectors against these attributes to toggle its separator border without
 * forcing a React re-render on every scroll frame.
 *
 * Once CSS scroll-state container queries are supported across target
 * browsers, both attributes and the `onScroll` / `ResizeObserver` plumbing
 * below can be removed in favor of
 * `@container scroll-state(scrollable: top)` / `(scrollable: bottom)`.
 * See: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Conditional_rules/Container_scroll-state_queries
 */
const SCROLLED_FROM_TOP_ATTR = 'data-wp-ui-overlay-scrolled-from-top';
const SCROLLED_FROM_BOTTOM_ATTR = 'data-wp-ui-overlay-scrolled-from-bottom';

/**
 * Allow fractional-pixel rounding when comparing scroll offsets. Browsers can
 * report `scrollTop + clientHeight` as slightly less than `scrollHeight` even
 * when fully scrolled to the bottom.
 */
const SCROLL_END_EPSILON = 1;

function updateScrollAttributes( el: HTMLElement ) {
	const { scrollTop, clientHeight, scrollHeight } = el;
	el.toggleAttribute( SCROLLED_FROM_TOP_ATTR, scrollTop > 0 );
	el.toggleAttribute(
		SCROLLED_FROM_BOTTOM_ATTR,
		scrollTop + clientHeight < scrollHeight - SCROLL_END_EPSILON
	);
}

/**
 * Keeps `data-wp-ui-overlay-scrolled-from-top` and
 * `data-wp-ui-overlay-scrolled-from-bottom` attributes in sync with the
 * scrollable overlay element's scroll position.
 *
 * The caller is responsible for wiring the returned `onScroll` handler to the
 * scroll container, and for providing a ref to the same element so the hook
 * can initialize the attributes and observe resizes (viewport, size preset
 * changes, content height changes that don't resize the surface because of
 * `max-height`).
 *
 * @param scrollContainerRef Ref to the scrollable overlay surface (e.g. dialog
 *                           popup, drawer panel).
 */
export function useOverlayScrollStateAttributes(
	scrollContainerRef: RefObject< HTMLElement | null >
) {
	const handleScroll = useCallback( ( event: UIEvent< HTMLElement > ) => {
		updateScrollAttributes( event.currentTarget );
	}, [] );

	useLayoutEffect( () => {
		const el = scrollContainerRef.current;
		if ( ! el ) {
			return;
		}

		updateScrollAttributes( el );

		const observer = new ResizeObserver( () => {
			if ( scrollContainerRef.current ) {
				updateScrollAttributes( scrollContainerRef.current );
			}
		} );
		observer.observe( el );
		for ( const child of Array.from( el.children ) ) {
			observer.observe( child );
		}

		return () => observer.disconnect();
		// `scrollContainerRef` is a stable ref; listed to satisfy exhaustive-deps.
	}, [ scrollContainerRef ] );

	return { onScroll: handleScroll };
}
