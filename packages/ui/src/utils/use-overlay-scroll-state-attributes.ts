import type { UIEvent, UIEventHandler } from 'react';
import { useCallback, useLayoutEffect, useState } from '@wordpress/element';

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
 * `data-wp-ui-overlay-scrolled-from-bottom` attributes in sync with a
 * scrollable overlay element's scroll position. CSS descendant selectors
 * (e.g. sticky header/footer chrome) read these attributes to toggle their
 * separator border without forcing a React re-render on every scroll frame.
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

		updateScrollAttributes( node );

		if ( typeof ResizeObserver === 'undefined' ) {
			return;
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
						if ( added instanceof HTMLElement ) {
							resizeObserver.observe( added );
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
