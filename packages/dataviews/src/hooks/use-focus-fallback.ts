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
			// The layout is inert while it loads, e.g. after an action.
			! element.closest( '[inert]' )
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
 * @param isEmpty Whether there are no items left to show, in which case the
 *                layout has no controls and focus moves to the ones around it.
 */
export default function useFocusFallback( isEmpty: boolean ) {
	const isEmptyRef = useRef( isEmpty );
	useLayoutEffect( () => {
		isEmptyRef.current = isEmpty;
	}, [ isEmpty ] );
	return useRefEffect( ( container: HTMLElement ) => {
		const { ownerDocument } = container;
		let lastFocused: HTMLElement | null = null;
		const onFocusIn = ( event: FocusEvent ) => {
			lastFocused = event.target as HTMLElement;
		};
		// Focus that leaves for nowhere while the control is still usable was
		// moved away on purpose, e.g. by clicking outside any control. Don't
		// bring it back when that control goes away later. A modal hiding the
		// rest of the page also blurs the control, but focus comes back on
		// close. Removing or hiding the control blurs it too, so only decide
		// once that is done.
		const onFocusOut = ( event: FocusEvent ) => {
			const target = event.target as HTMLElement;
			const next = event.relatedTarget as HTMLElement | null;
			// Focus moved to another control outside the layout, e.g. the
			// search, was moved on purpose too. Menus and dialogs opened from
			// the layout hand it back, so keep tracking for them.
			if ( next ) {
				if (
					! container.contains( next ) &&
					! next.closest(
						'[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]'
					)
				) {
					lastFocused = null;
				}
				return;
			}
			if ( target.closest( '[inert], [aria-hidden="true"]' ) ) {
				return;
			}
			queueMicrotask( () => {
				if (
					lastFocused === target &&
					target.isConnected &&
					isVisible( target )
				) {
					lastFocused = null;
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
			if ( ! wasRemoved || ! isLost ) {
				return;
			}
			// With no items left, the layout has no controls: use the ones
			// around it, such as the search.
			const fallback =
				getFallback( container ) ??
				( isEmptyRef.current
					? getFallback(
							container.closest< HTMLElement >(
								'.dataviews-wrapper'
							) ?? container
						)
					: undefined );
			// Nothing to move focus to yet, e.g. while the previous page loads
			// after the last item of a page was removed: try again on the next
			// change.
			if ( ! fallback ) {
				return;
			}
			// Once it lands, `onFocusIn` tracks the fallback instead. Until
			// then, the next change tries again.
			fallback.focus();
		};
		// Wait a frame, so that a closing popover or modal returns focus to its
		// trigger first. Focus is only lost if it is still nowhere after that.
		let frame: number | undefined;
		const scheduleRestore = () => {
			if ( ! lastFocused ) {
				return;
			}
			const { defaultView } = ownerDocument;
			if ( frame !== undefined ) {
				defaultView?.cancelAnimationFrame( frame );
			}
			frame = defaultView?.requestAnimationFrame( () => {
				frame = undefined;
				restoreFocus();
			} );
		};
		const observer = new MutationObserver( scheduleRestore );
		container.addEventListener( 'focusin', onFocusIn );
		container.addEventListener( 'focusout', onFocusOut );
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
			container.removeEventListener( 'focusin', onFocusIn );
			container.removeEventListener( 'focusout', onFocusOut );
			observer.disconnect();
			pageObserver.disconnect();
			if ( frame !== undefined ) {
				ownerDocument.defaultView?.cancelAnimationFrame( frame );
			}
		};
	}, [] );
}
