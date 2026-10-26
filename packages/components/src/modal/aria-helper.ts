const LIVE_REGION_ARIA_ROLES = new Set( [
	'alert',
	'status',
	'log',
	'marquee',
	'timer',
] );

const hiddenElementsByModal = new Map< Element, Element[] >();

/**
 * Hides all elements in the body element from screen-readers except
 * the provided element and elements that should not be hidden from
 * screen-readers.
 *
 * The reason we do this is because `aria-modal="true"` currently is bugged
 * in Safari, and support is spotty in other browsers overall. In the future
 * we should consider removing these helper functions in favor of
 * `aria-modal="true"`.
 *
 * @param modalElement The element that should not be hidden.
 */
export function modalize( modalElement: HTMLDivElement ) {
	const elements = Array.from( document.body.children );
	const hiddenElements: Element[] = [];
	hiddenElementsByModal.set( modalElement, hiddenElements );
	for ( const element of elements ) {
		if ( element === modalElement ) {
			continue;
		}

		if ( elementShouldBeHidden( element ) ) {
			element.setAttribute( 'aria-hidden', 'true' );
			hiddenElements.push( element );
		}
	}
}

/**
 * Determines if the passed element should not be hidden from screen readers.
 *
 * @param element The element that should be checked.
 *
 * @return Whether the element should not be hidden from screen-readers.
 */
export function elementShouldBeHidden( element: Element ) {
	const role = element.getAttribute( 'role' );
	return ! (
		element.tagName === 'SCRIPT' ||
		element.hasAttribute( 'hidden' ) ||
		element.hasAttribute( 'aria-hidden' ) ||
		element.hasAttribute( 'aria-live' ) ||
		( role && LIVE_REGION_ARIA_ROLES.has( role ) )
	);
}

/**
 * Accessibly reveals the elements hidden by the provided modal.
 *
 * Modals can close in any order, so elements the closing modal hid stay hidden
 * while another modal is open, and are revealed once that modal closes.
 *
 * @param modalElement The element of the closing modal.
 */
export function unmodalize( modalElement: HTMLDivElement ) {
	const hiddenElements = hiddenElementsByModal.get( modalElement );
	if ( ! hiddenElements ) {
		return;
	}
	hiddenElementsByModal.delete( modalElement );

	const [ topModalElement, topModalHiddenElements ] =
		Array.from( hiddenElementsByModal ).pop() ?? [];
	for ( const element of hiddenElements ) {
		if ( topModalHiddenElements && element !== topModalElement ) {
			topModalHiddenElements.push( element );
		} else {
			element.removeAttribute( 'aria-hidden' );
		}
	}
}
