const LIVE_REGION_ARIA_ROLES = new Set( [
	'alert',
	'status',
	'log',
	'marquee',
	'timer',
] );

const modalElements: Element[] = [];
const hiddenElements = new Set< Element >();

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
	modalElements.push( modalElement );
	// A modal opened in the same commit may have hidden this one.
	if ( hiddenElements.delete( modalElement ) ) {
		modalElement.removeAttribute( 'aria-hidden' );
	}
	for ( const element of Array.from( document.body.children ) ) {
		if ( element !== modalElement && elementShouldBeHidden( element ) ) {
			element.setAttribute( 'aria-hidden', 'true' );
			hiddenElements.add( element );
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
 * Accessibly reveals the topmost remaining modal, or all hidden elements once
 * the last modal closes.
 *
 * @param modalElement The element of the closing modal.
 */
export function unmodalize( modalElement: HTMLDivElement ) {
	modalElements.splice( modalElements.indexOf( modalElement ), 1 );
	const topModalElement = modalElements[ modalElements.length - 1 ];
	for ( const element of hiddenElements ) {
		if ( ! topModalElement || element === topModalElement ) {
			element.removeAttribute( 'aria-hidden' );
			hiddenElements.delete( element );
		}
	}
}
