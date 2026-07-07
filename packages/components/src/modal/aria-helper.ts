const LIVE_REGION_ARIA_ROLES = new Set( [
	'alert',
	'status',
	'log',
	'marquee',
	'timer',
] );

const hiddenElementsByDepth: Element[][] = [];

/**
 * Hides all elements in the body element from screen-readers and keyboard
 * navigation except the provided element and elements that should not be
 * hidden. Uses the `inert` attribute so that hidden regions are both
 * removed from the accessibility tree and unreachable via keyboard.
 *
 * @param modalElement The element that should not be hidden.
 */
export function modalize( modalElement?: HTMLDivElement ) {
	const elements = Array.from( document.body.children );
	const hiddenElements: Element[] = [];
	hiddenElementsByDepth.push( hiddenElements );
	for ( const element of elements ) {
		if ( element === modalElement ) {
			continue;
		}

		if ( elementShouldBeHidden( element ) ) {
			( element as HTMLElement ).inert = true;
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
		( element as HTMLElement ).inert ||
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
		( element as HTMLElement ).inert = false;
	}
}
