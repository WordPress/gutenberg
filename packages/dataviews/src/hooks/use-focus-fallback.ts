import { useRefEffect } from '@wordpress/compose';
import { useLayoutEffect, useRef } from '@wordpress/element';

const FOCUSABLE_SELECTOR = [
	'button:not([disabled])',
	'input:not([disabled])',
	'a[href]',
	'[tabindex="0"]',
	'[role="checkbox"]:not([aria-disabled="true"])',
].join( ',' );

function isVisible( element: Element ) {
	return element.getClientRects().length > 0;
}

function getScrollContainer( element: HTMLElement ) {
	const { defaultView } = element.ownerDocument;
	for (
		let node: HTMLElement | null = element;
		node;
		node = node.parentElement
	) {
		const { overflowY } = defaultView?.getComputedStyle( node ) ?? {};
		if ( overflowY === 'auto' || overflowY === 'scroll' ) {
			return node;
		}
	}
	return null;
}

/**
 * The control to focus when focus is lost: the first checkbox, which is the
 * "Select all" one where the layout has it, or else the first control.
 *
 * @param container The layout container.
 */
function getFallback( container: HTMLElement ) {
	const controls = Array.from(
		container.querySelectorAll< HTMLElement >( FOCUSABLE_SELECTOR )
	).filter(
		( element ) =>
			element.tabIndex >= 0 &&
			isVisible( element ) &&
			// Usable, rather than disabled but still focusable.
			! element.matches( ':disabled, [aria-disabled="true"]' ) &&
			// Hidden on its own, like the table media, or inert while the
			// layout loads, e.g. after an action.
			! element.closest( '[aria-hidden="true"], [inert]' )
	);
	return (
		controls.find(
			( element ) =>
				element.getAttribute( 'role' ) === 'checkbox' ||
				( element as HTMLInputElement ).type === 'checkbox'
		) ?? controls[ 0 ]
	);
}

/**
 * Keeps focus in the layout when the focused control goes away, e.g. when an
 * action removes the item whose row held it, or the control a modal returns
 * focus to is gone by the time the modal closes. Without this, focus falls
 * back to the document body and keyboard users have to start over from the
 * top of the page.
 *
 * @param options                  Options.
 * @param options.isEmpty          Whether there are no items left to show, in
 *                                 which case the layout has no controls and
 *                                 focus moves to the ones around it.
 * @param options.isInfiniteScroll Whether items load as the view scrolls,
 *                                 which also unloads the ones scrolled past.
 */
export default function useFocusFallback( {
	isEmpty,
	isInfiniteScroll,
}: {
	isEmpty: boolean;
	isInfiniteScroll: boolean;
} ) {
	const optionsRef = useRef( { isEmpty, isInfiniteScroll } );
	useLayoutEffect( () => {
		optionsRef.current = { isEmpty, isInfiniteScroll };
	}, [ isEmpty, isInfiniteScroll ] );
	return useRefEffect( ( container: HTMLElement ) => {
		const { ownerDocument } = container;
		// The control to bring focus back to if it goes away while focused. It
		// is the last control focused in the layout, kept while focus is in a
		// menu or dialog opened from it, which hand focus back when they close.
		let lastFocused: HTMLElement | null = null;
		// Whether it was on screen when last seen. Infinite scroll unloads
		// items once they are well off screen, which isn't focus going away.
		let wasInView = true;
		const { defaultView } = ownerDocument;
		const IntersectionObserverClass = defaultView?.IntersectionObserver;
		const visibility = IntersectionObserverClass
			? new IntersectionObserverClass(
					( entries ) => {
						for ( const entry of entries ) {
							// Removing or hiding it also reports it off screen.
							if (
								entry.target === lastFocused &&
								entry.target.isConnected &&
								isVisible( entry.target )
							) {
								wasInView = entry.isIntersecting;
							}
						}
					},
					{
						// Against the scroll container, a little beyond its
						// edges, as unloading only takes rows well past them.
						// Sideways scrolling doesn't unload anything.
						root: getScrollContainer( container ),
						rootMargin: '400px 100000px',
					}
				)
			: undefined;
		const track = ( element: HTMLElement | null ) => {
			if ( element === lastFocused ) {
				return;
			}
			if ( lastFocused ) {
				visibility?.unobserve( lastFocused );
			}
			lastFocused = element;
			wasInView = true;
			if ( element ) {
				visibility?.observe( element );
			}
		};
		const isHandOff = ( element: HTMLElement ) => {
			const popup = element.closest(
				'[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], .components-popover'
			);
			// Not the dialog the whole view is in, such as a media modal.
			return !! popup && ! popup.contains( container );
		};
		// Hidden along with the rest of the page by a modal, or inert while
		// the layout loads, rather than hidden on its own like the table media.
		const isHiddenByModal = ( element: HTMLElement ) => {
			const hidden = element.closest( '[aria-hidden="true"]' );
			return (
				!! element.closest( '[inert]' ) ||
				( !! hidden && hidden.contains( container ) )
			);
		};
		const onFocusIn = ( event: FocusEvent ) => {
			const target = event.target as HTMLElement;
			if ( container.contains( target ) ) {
				track( target );
			} else if ( ! isHandOff( target ) ) {
				// Focus moved on to another control, e.g. the search.
				track( null );
			}
		};
		// Focus that leaves for nowhere while the control is still usable was
		// moved away on purpose, e.g. by clicking outside any control. Don't
		// bring it back when that control goes away later. A modal hiding the
		// rest of the page also blurs the control, but focus comes back on
		// close. Removing or hiding the control blurs it too, so only decide
		// once that is done.
		const onFocusOut = ( event: FocusEvent ) => {
			const target = event.target as HTMLElement;
			if (
				event.relatedTarget ||
				! ( container.contains( target ) || isHandOff( target ) ) ||
				isHiddenByModal( target )
			) {
				return;
			}
			queueMicrotask( () => {
				const { activeElement } = ownerDocument;
				if (
					target.isConnected &&
					isVisible( target ) &&
					// Unless focus went on to another control meanwhile.
					( ! activeElement || activeElement === ownerDocument.body )
				) {
					track( null );
				}
			} );
		};
		const restoreFocus = () => {
			// Behind an open modal, focus belongs to the modal. Check again
			// once it closes.
			if (
				! lastFocused ||
				container.closest( '[inert], [aria-hidden="true"]' )
			) {
				return;
			}
			const { activeElement } = ownerDocument;
			const wasRemoved =
				! lastFocused.isConnected || ! isVisible( lastFocused );
			const isLost =
				! activeElement ||
				activeElement === ownerDocument.body ||
				( activeElement === lastFocused && wasRemoved );
			if ( ! isLost ) {
				return;
			}
			// Still there, but focus was knocked off it, e.g. as the layout
			// turned inert to load while a modal returned focus to it.
			if ( ! wasRemoved ) {
				if ( ! lastFocused.closest( '[inert]' ) ) {
					lastFocused.focus( { preventScroll: true } );
				}
				return;
			}
			// Infinite scroll unloads the items scrolled past, which is not
			// the focused item going away. An action removes one on screen.
			if ( optionsRef.current.isInfiniteScroll && ! wasInView ) {
				track( null );
				return;
			}
			// With no items left, the layout has no controls: use the ones
			// around it, such as the search.
			const fallback =
				getFallback( container ) ??
				( optionsRef.current.isEmpty
					? getFallback(
							container.closest< HTMLElement >(
								'.dataviews-wrapper, .dataviews-picker-wrapper'
							) ?? container
						)
					: undefined );
			// Nothing to move focus to yet, e.g. while the previous page loads
			// after the last item of a page was removed: try again on the next
			// change.
			if ( ! fallback ) {
				return;
			}
			// Once it lands, `onFocusIn` tracks the fallback, or stops tracking
			// for one outside the layout. Until then, the next change tries
			// again.
			fallback.focus();
		};
		// Wait a frame, so that a closing popover or modal returns focus to its
		// trigger first. Focus is only lost if it is still nowhere after that.
		let frame: number | undefined;
		const scheduleRestore = () => {
			if ( ! lastFocused ) {
				return;
			}
			if ( frame !== undefined ) {
				defaultView?.cancelAnimationFrame( frame );
			}
			frame = defaultView?.requestAnimationFrame( () => {
				frame = undefined;
				restoreFocus();
			} );
		};
		const observer = new MutationObserver( scheduleRestore );
		ownerDocument.addEventListener( 'focusin', onFocusIn );
		ownerDocument.addEventListener( 'focusout', onFocusOut );
		observer.observe( container, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: [ 'hidden', 'inert' ],
		} );
		// Modals render outside the layout, and hide the rest of the page while
		// open. One can close after its action removed the control it returns
		// focus to, without changing the layout any more, so check again when
		// it goes away and when the page is shown again.
		observer.observe( ownerDocument.body, { childList: true } );
		const pageObserver = new MutationObserver( scheduleRestore );
		pageObserver.observe( ownerDocument.body, {
			subtree: true,
			attributes: true,
			attributeFilter: [ 'aria-hidden', 'inert' ],
		} );
		return () => {
			ownerDocument.removeEventListener( 'focusin', onFocusIn );
			ownerDocument.removeEventListener( 'focusout', onFocusOut );
			observer.disconnect();
			pageObserver.disconnect();
			visibility?.disconnect();
			if ( frame !== undefined ) {
				defaultView?.cancelAnimationFrame( frame );
			}
		};
	}, [] );
}
