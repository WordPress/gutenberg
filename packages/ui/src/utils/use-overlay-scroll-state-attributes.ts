import type { UIEvent, UIEventHandler } from 'react';
import { useIsomorphicLayoutEffect } from '@wordpress/compose';
import { useCallback, useState } from '@wordpress/element';

export const SCROLL_CONTAINER_ATTR = 'data-wp-ui-overlay-scroll-container';
const SCROLLED_FROM_TOP_ATTR = 'data-wp-ui-overlay-scrolled-from-top';
const SCROLLED_FROM_BOTTOM_ATTR = 'data-wp-ui-overlay-scrolled-from-bottom';
/**
 * Marks a `tabindex` that this hook installed, so subsequent runs can tell
 * a hook-managed tabindex apart from one the consumer set on the element
 * themselves.
 *
 * Internal: the constant is not exported, but the literal string is named
 * in the public JSDoc on `useOverlayScrollStateAttributes` so consumers
 * grepping for "why does this element have a `tabindex='0'` I didn't set?"
 * can find the breadcrumb. If this string changes, update the JSDoc too.
 */
const SCROLL_TABBABLE_FLAG_ATTR = 'data-wp-ui-overlay-scroll-tabbable';

/**
 * Allow fractional-pixel rounding when comparing scroll offsets. Browsers can
 * report `scrollTop + clientHeight` as slightly less than `scrollHeight` even
 * when fully scrolled to the bottom.
 */
const SCROLL_END_EPSILON = 1;

/**
 * Detect consumer takeover of a previously hook-managed `tabindex` after the
 * hook had already installed its own: if the flag is set but the current
 * `tabindex` is no longer `"0"`, the consumer has overridden our value. Drop
 * the flag so subsequent ticks treat the `tabindex` as consumer-owned and
 * never touch it again.
 *
 * Limitation: the heuristic compares the DOM attribute, so a consumer who
 * passes `tabIndex={ 0 }` explicitly is indistinguishable from our own
 * managed `"0"` and would still be cleaned up on the next non-overflow
 * tick. See the contract paragraph on `useOverlayScrollStateAttributes`.
 *
 * @param el The scroll container.
 */
function reconcileTabbableFlag( el: HTMLElement ) {
	if (
		el.hasAttribute( SCROLL_TABBABLE_FLAG_ATTR ) &&
		el.getAttribute( 'tabindex' ) !== '0'
	) {
		el.removeAttribute( SCROLL_TABBABLE_FLAG_ATTR );
	}
}

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

	// Takeover-after-install: detect a consumer who started overriding
	// our managed `"0"` *after* the hook installed it (e.g. a re-render
	// passing `tabIndex={ -1 }`). The flag is dropped so the install /
	// cleanup branches below leave the consumer's value untouched.
	reconcileTabbableFlag( el );

	if ( overflows ) {
		// Pre-install opt-out: a consumer-supplied `tabindex` (including
		// `tabindex="-1"` to hide the region from Tab order) keeps its
		// value because the flag is never installed in the first place.
		// If that consumer-supplied value is later *removed*, the hook
		// will install its own on the next overflow tick — the DOM
		// attribute alone can't distinguish a prior explicit opt-out
		// from an unconfigured state.
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

const HOOK_OWNED_ATTRS = [
	SCROLL_CONTAINER_ATTR,
	SCROLLED_FROM_TOP_ATTR,
	SCROLLED_FROM_BOTTOM_ATTR,
] as const;

function cleanupScrollAttributes( el: HTMLElement ) {
	for ( const attr of HOOK_OWNED_ATTRS ) {
		el.removeAttribute( attr );
	}
	// Reconcile first so a flag left over from a consumer-takeover never
	// causes us to clobber the consumer's `tabindex` here.
	reconcileTabbableFlag( el );
	// After reconciliation the flag is set only when the current
	// `tabindex` is still `"0"` (i.e. ours). Any other value belongs to
	// the consumer and is left alone.
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
 * attribute (`data-wp-ui-overlay-scroll-tabbable`) marks tabindex values
 * the hook installed, so a consumer-supplied `tabindex` is never
 * overwritten.
 *
 * Tabindex contract:
 * - **Pre-install opt-out**: a `tabindex` set on the element before the
 *   first overflow is detected is left alone forever. The flag is never
 *   installed, so the hook never owns the attribute. (This means
 *   `tabIndex={ -1 }` on `Dialog.Content` / `Drawer.Content` reliably
 *   suppresses the auto tab stop.)
 * - **Takeover after install**: if the consumer overrides the hook's
 *   `"0"` with a *different* value after the fact, the flag is dropped
 *   on the next tick (`reconcileTabbableFlag`) and the consumer's value
 *   is preserved through subsequent overflow / non-overflow transitions
 *   and through cleanup.
 * - **Indistinguishable case**: a consumer who passes `tabIndex={ 0 }`
 *   explicitly while the hook also has `"0"` installed cannot be
 *   detected — the DOM attribute is identical to the hook-managed
 *   value, so the hook will still strip it on the next non-overflow
 *   tick. This is rarely intentional (the consumer's `0` matches the
 *   hook's behavior anyway), but consumers needing a guaranteed
 *   sticky `0` should avoid relying on it across overflow flips.
 *
 * Overflow detection is block-axis-only. Overlay popups are expected to
 * constrain content width (`overlay-chrome.module.css` clips `.content`
 * with `overflow-inline: hidden`); horizontal scrolling is intentionally
 * not supported, so this hook doesn't toggle tabindex on inline-axis
 * overflow and the scroll-state attributes don't track it.
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
 * Change detection combines a `ResizeObserver` scoped to the container
 * and its direct children (to catch flex-layout growth) with a
 * `MutationObserver` on direct-child additions/removals only (to keep
 * the resize-observer set in sync as direct children come and go).
 *
 * Deeper subtree mutations are intentionally not observed: in practice,
 * any descendant whose growth changes the scroll size also propagates a
 * resize up the layout tree, so the existing `ResizeObserver` on direct
 * children catches it. Watching the full subtree would fan out the
 * mutation callback over every text-node insertion in content-heavy
 * overlays (rich-text editors, virtualized lists), which isn't worth
 * the cost of the rare deep-mutation-without-resize case. Revisit
 * (and consider rAF-coalescing the callback) if a real consumer hits
 * an attribute-staleness regression.
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

	useIsomorphicLayoutEffect( () => {
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
					// Only direct-child additions/removals affect what the
					// ResizeObserver is observing; deeper descendant changes
					// reach us through this callback for attribute refresh,
					// but we don't observe them individually to keep the
					// cost bounded on large subtrees.
					if ( record.target === node ) {
						for ( const added of Array.from( record.addedNodes ) ) {
							if ( added instanceof Element ) {
								resizeObserver.observe( added );
							}
						}
						for ( const removed of Array.from(
							record.removedNodes
						) ) {
							if ( removed instanceof Element ) {
								resizeObserver.unobserve( removed );
							}
						}
					}
				}
				updateScrollAttributes( node );
			} );
			// Direct children only — see the JSDoc above for why we
			// intentionally don't observe the full subtree.
			mutationObserver.observe( node, {
				childList: true,
			} );
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
