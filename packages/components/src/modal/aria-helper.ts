const LIVE_REGION_ARIA_ROLES = new Set( [
	'alert',
	'status',
	'log',
	'marquee',
	'timer',
] );

const documentStates = new WeakMap<
	Document,
	{ modalElements: Element[]; hiddenElements: Set< Element > }
>();

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
	const ownerDocument = modalElement.ownerDocument;
	let state = documentStates.get( ownerDocument );
	if ( ! state ) {
		state = { modalElements: [], hiddenElements: new Set() };
		documentStates.set( ownerDocument, state );
	}
	const { modalElements, hiddenElements } = state;
	modalElements.push( modalElement );
	// An earlier modal may have hidden this modal or its owning portal.
	for ( const element of hiddenElements ) {
		if ( element.contains( modalElement ) ) {
			element.removeAttribute( 'aria-hidden' );
			hiddenElements.delete( element );
		}
	}
	// UI-owned portals can contain a legacy Modal. Isolate sibling branches
	// at each level instead of hiding an ancestor that contains the Modal.
	let current: Element | null = modalElement;
	while ( current?.parentElement ) {
		for ( const element of Array.from( current.parentElement.children ) ) {
			if ( element !== current && elementShouldBeHidden( element ) ) {
				element.setAttribute( 'aria-hidden', 'true' );
				hiddenElements.add( element );
			}
		}
		if ( current.parentElement === ownerDocument.body ) {
			break;
		}
		current = current.parentElement;
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
	const state = documentStates.get( modalElement.ownerDocument );
	if ( ! state ) {
		return;
	}
	const { modalElements, hiddenElements } = state;
	modalElements.splice( modalElements.indexOf( modalElement ), 1 );
	const topModalElement = modalElements[ modalElements.length - 1 ];
	for ( const element of hiddenElements ) {
		if (
			! topModalElement ||
			element.contains( topModalElement ) ||
			topModalElement.contains( element )
		) {
			element.removeAttribute( 'aria-hidden' );
			hiddenElements.delete( element );
		}
	}
	if ( ! modalElements.length ) {
		documentStates.delete( modalElement.ownerDocument );
	}
}
