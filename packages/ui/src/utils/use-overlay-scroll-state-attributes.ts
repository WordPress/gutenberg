import type { UIEvent, UIEventHandler } from 'react';
import { useCallback, useLayoutEffect, useState } from '@wordpress/element';

export const SCROLL_CONTAINER_ATTR = 'data-wp-ui-overlay-scroll-container';
const SCROLLED_FROM_TOP_ATTR = 'data-wp-ui-overlay-scrolled-from-top';
const SCROLLED_FROM_BOTTOM_ATTR = 'data-wp-ui-overlay-scrolled-from-bottom';
/**
 * Marks a `tabindex` that this hook installed, so subsequent runs can tell
 * a hook-managed tabindex apart from one the consumer set on the element
 * themselves.
 */
const SCROLL_TABBABLE_FLAG_ATTR = 'data-wp-ui-overlay-scroll-tabbable';

/**
 * Allow fractional-pixel rounding when comparing scroll offsets. Browsers can
 * report `scrollTop + clientHeight` as slightly less than `scrollHeight` even
 * when fully scrolled to the bottom.
 */
const SCROLL_END_EPSILON = 1;

function updateScrollAttributes( el: HTMLElement ) {
	const { scrollTop, clientHeight, scrollHeight } = el;
	const overflows = scrollHeight - clientHeight > SCROLL_END_EPSILON;

	el.toggleAttribute( SCROLLED_FROM_TOP_ATTR, scrollTop > 0 );
	el.toggleAttribute(
		SCROLLED_FROM_BOTTOM_ATTR,
		scrollTop + clientHeight < scrollHeight - SCROLL_END_EPSILON
	);

	// Keyboard-scrollable regions must be reachable via Tab (WCAG 2.1.1),
	// but adding a stray tab stop to a non-scrolling `<div>` is an
	// anti-pattern. Toggle `tabindex="0"` only while the element actually
	// overflows. The flag attribute guards against clobbering a
	// consumer-supplied tabindex: we only touch attributes we installed.
	if ( overflows ) {
		if (
			! el.hasAttribute( SCROLL_TABBABLE_FLAG_ATTR ) &&
			el.getAttribute( 'tabindex' ) === null
		) {
			el.setAttribute( 'tabindex', '0' );
			el.setAttribute( SCROLL_TABBABLE_FLAG_ATTR, '' );
		}
	} else if ( el.hasAttribute( SCROLL_TABBABLE_FLAG_ATTR ) ) {
		el.removeAttribute( 'tabindex' );
		el.removeAttribute( SCROLL_TABBABLE_FLAG_ATTR );
	}
}

function cleanupScrollAttributes( el: HTMLElement ) {
	el.removeAttribute( SCROLL_CONTAINER_ATTR );
	el.removeAttribute( SCROLLED_FROM_TOP_ATTR );
	el.removeAttribute( SCROLLED_FROM_BOTTOM_ATTR );
	if ( el.hasAttribute( SCROLL_TABBABLE_FLAG_ATTR ) ) {
		el.removeAttribute( 'tabindex' );
		el.removeAttribute( SCROLL_TABBABLE_FLAG_ATTR );
	}
}

/**
 * Keeps `data-wp-ui-overlay-scrolled-from-top` and
 * `data-wp-ui-overlay-scrolled-from-bottom` attributes in sync with a
 * scrollable overlay element's scroll position, and marks the element with
 * `data-wp-ui-overlay-scroll-container` so shared CSS (see
 * `overlay-chrome.module.css`) can target it without coupling to a specific
 * class name. Descendant selectors (e.g. sticky header/footer chrome) read
 * these attributes to toggle their separator border without forcing a React
 * re-render on every scroll frame.
 *
 * When the element overflows, a `tabindex="0"` is also installed so keyboard
 * users can focus the region and arrow-scroll it (WCAG 2.1.1). The tabindex
 * is removed again as soon as the element no longer overflows — a stray tab
 * stop on a non-scrolling region is an anti-pattern. An internal flag
 * attribute ensures a consumer-supplied `tabindex` is never overwritten.
 *
 * Returns a callback `ref` that the caller must attach to the scroll
 * container, and an `onScroll` handler to wire up to the same element. A
 * callback ref (not a `RefObject`) is used because overlay libraries like
 * Base UI mount the popup DOM lazily when the overlay opens, so the
 * attributes must be initialized the moment the node is attached, not when
 * the host component first renders. `useState` also absorbs repeated
 * attachments of the same node (Strict Mode remount, stable refs) without
 * re-running the effect.
 *
 * Change detection uses a `ResizeObserver` on the container and its direct
 * children plus a `MutationObserver` on the container's `childList`, so the
 * attributes follow children that are added, removed, or resized after the
 * popup opens. Deep descendant resizes are caught as long as they propagate
 * up to a direct child (the common case in normal block layouts).
 *
 * Once CSS scroll-state container queries are supported across target
 * browsers, both the data attributes and this hook can be replaced with
 * `@container scroll-state(scrollable: top)` / `(scrollable: bottom)`.
 * See: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Conditional_rules/Container_scroll-state_queries
 *
 * @param onScroll Optional `onScroll` from the parent; invoked after the
 *                 overlay scroll-state attributes are updated, so by the
 *                 time this handler runs, `data-wp-ui-overlay-scrolled-*`
 *                 on `event.currentTarget` already reflect the post-scroll
 *                 state.
 */
export function useOverlayScrollStateAttributes<
	T extends HTMLElement = HTMLElement,
>( onScroll?: UIEventHandler< T > | undefined ) {
	const [ node, setNode ] = useState< T | null >( null );

	const ref = useCallback( ( el: T | null ) => {
		setNode( el );
	}, [] );

	useLayoutEffect( () => {
		if ( ! node ) {
			return;
		}

		node.setAttribute( SCROLL_CONTAINER_ATTR, '' );
		updateScrollAttributes( node );

		if ( typeof ResizeObserver === 'undefined' ) {
			return () => {
				cleanupScrollAttributes( node );
			};
		}

		const resizeObserver = new ResizeObserver( () => {
			updateScrollAttributes( node );
		} );
		resizeObserver.observe( node );
		for ( const child of Array.from( node.children ) ) {
			resizeObserver.observe( child );
		}

		let mutationObserver: MutationObserver | undefined;
		if ( typeof MutationObserver !== 'undefined' ) {
			mutationObserver = new MutationObserver( ( records ) => {
				for ( const record of records ) {
					for ( const added of Array.from( record.addedNodes ) ) {
						if ( added instanceof Element ) {
							resizeObserver.observe( added );
						}
					}
					for ( const removed of Array.from( record.removedNodes ) ) {
						if ( removed instanceof Element ) {
							resizeObserver.unobserve( removed );
						}
					}
				}
				updateScrollAttributes( node );
			} );
			mutationObserver.observe( node, { childList: true } );
		}

		return () => {
			resizeObserver.disconnect();
			mutationObserver?.disconnect();
			cleanupScrollAttributes( node );
		};
	}, [ node ] );

	const handleScroll = useCallback(
		( event: UIEvent< T > ) => {
			updateScrollAttributes( event.currentTarget );
			onScroll?.( event );
		},
		[ onScroll ]
	);

	return { ref, onScroll: handleScroll };
}
