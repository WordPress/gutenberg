/**
 * External dependencies
 */
import { forEach } from 'lodash';

let hiddenElements = [],
	isHidden = false;

/**
 * Hides all elements in the body element from screen-readers except
 * the provided element, script elements and elements that already have
 * an `aria-hidden="true"` attribute.
 *
 * The reason we do this is because `aria-modal="true"` currently is bugged
 * in Safari, and support is spotty in other browsers overall. In the future
 * we should consider removing these helper functions in favor of
 * `aria-modal="true"`.
 *
 * @param {Element} unhiddenElement The element that should not be hidden.
 */
export function hideApp( unhiddenElement ) {
	if ( isHidden ) {
		return;
	}
	const elements = document.body.children;
	forEach( elements, ( element ) => {
		if (
			element === unhiddenElement ||
			element.tagName === 'SCRIPT' ||
			element.hasAttribute( 'aria-hidden', 'true' )
		) {
			return;
		}
		element.setAttribute( 'aria-hidden', 'true' );
		hiddenElements.push( element );
	} );
	isHidden = true;
}

/**
 * Makes all elements in the body that have been hidden by `hideApp`
 * visible again to screen-readers.
 */
export function showApp() {
	if ( ! isHidden ) {
		return;
	}
	forEach( hiddenElements, ( element ) => {
		element.removeAttribute( 'aria-hidden' );
	} );
	hiddenElements = [];
	isHidden = false;
}
