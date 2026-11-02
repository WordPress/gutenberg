import { useRefEffect } from '@wordpress/compose';

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
	).filter( ( element ) => element.tabIndex >= 0 && isVisible( element ) );
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
 */
export default function useFocusFallback() {
	return useRefEffect( ( container: HTMLElement ) => {
		const { ownerDocument } = container;
		let lastFocused: HTMLElement | null = null;
		const onFocusIn = ( event: FocusEvent ) => {
			lastFocused = event.target as HTMLElement;
		};
		const observer = new MutationObserver( () => {
			if ( ! lastFocused ) {
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
			lastFocused = null;
			getFallback( container )?.focus();
		} );
		container.addEventListener( 'focusin', onFocusIn );
		observer.observe( container, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: [ 'hidden', 'inert' ],
		} );
		return () => {
			container.removeEventListener( 'focusin', onFocusIn );
			observer.disconnect();
		};
	}, [] );
}
