import type { UIEvent, UIEventHandler } from 'react';
import { useCallback, useLayoutEffect, useState } from '@wordpress/element';

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
 * Returns a callback `ref` that the caller must attach to the scroll
 * container, and an `onScroll` handler to wire up to the same element. A
 * callback ref (not a `RefObject`) is used because overlay libraries like
 * Base UI mount the popup DOM lazily when the overlay opens, so the
 * attributes must be initialized the moment the node is attached, not when
 * this hook's host component first renders.
 *
 * @param onScroll Optional `onScroll` from the parent; invoked after the
 *                 overlay scroll-state attributes are updated.
 */
export function useOverlayScrollStateAttributes(
	onScroll?: UIEventHandler< HTMLElement > | undefined
) {
	const [ node, setNode ] = useState< HTMLElement | null >( null );

	const ref = useCallback( ( el: HTMLElement | null ) => {
		setNode( el );
	}, [] );

	useLayoutEffect( () => {
		if ( ! node ) {
			return;
		}

		updateScrollAttributes( node );

		if ( typeof ResizeObserver === 'undefined' ) {
			return;
		}

		const observer = new ResizeObserver( () => {
			updateScrollAttributes( node );
		} );
		observer.observe( node );
		for ( const child of Array.from( node.children ) ) {
			observer.observe( child );
		}

		return () => observer.disconnect();
	}, [ node ] );

	const handleScroll = useCallback(
		( event: UIEvent< HTMLElement > ) => {
			updateScrollAttributes( event.currentTarget );
			onScroll?.( event );
		},
		[ onScroll ]
	);

	return { ref, onScroll: handleScroll };
}
