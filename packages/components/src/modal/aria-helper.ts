const LIVE_REGION_ARIA_ROLES = new Set( [
	'alert',
	'status',
	'log',
	'marquee',
	'timer',
] );

const hiddenElementsByDepth: Element[][] = [];

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
export function modalize( modalElement?: HTMLDivElement ) {
	const hiddenElements: Element[] = [];
	hiddenElementsByDepth.push( hiddenElements );

	if ( ! modalElement ) {
		// Fallback (no modal element provided): hide all body children. Kept
		// for backwards compatibility with legacy callers.
		for ( const element of Array.from( document.body.children ) ) {
			if ( elementShouldBeHidden( element ) ) {
				element.setAttribute( 'aria-hidden', 'true' );
				hiddenElements.push( element );
			}
		}
		return;
	}

	// Walk up from the modal to <body>, hiding non-modal siblings at each
	// level. This preserves correct screen-reader semantics when the modal
	// is portaled into a wrapper (e.g. the overlay legacy slot): siblings
	// inside the wrapper — including an outer modal when nested — get
	// hidden, and so do siblings of the wrapper at the body level.
	let current: Element = modalElement;
	while ( current.parentElement ) {
		const parent = current.parentElement;
		for ( const sibling of Array.from( parent.children ) ) {
			if ( sibling === current ) {
				continue;
			}
			if ( elementShouldBeHidden( sibling ) ) {
				sibling.setAttribute( 'aria-hidden', 'true' );
				hiddenElements.push( sibling );
			}
		}
		if ( parent === document.body ) {
			break;
		}
		current = parent;
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
 * Accessibly reveals the elements hidden by the latest modal.
 */
export function unmodalize() {
	const hiddenElements = hiddenElementsByDepth.pop();
	if ( ! hiddenElements ) {
		return;
	}

	for ( const element of hiddenElements ) {
		element.removeAttribute( 'aria-hidden' );
	}
}
