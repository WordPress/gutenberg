/**
 * External dependencies
 */
import { forEach } from 'lodash';

let hiddenElements = [],
	isHidden = false;

/**
 * Hides all elements in the body element from screen-readers except
 * the provided element.
 *
 * @param {Element} unhiddenElement The element that should not be hidden.
 */
export function hideApp( unhiddenElement ) {
	if ( isHidden ) {
		return;
	}
	const elements = document.body.children;
	forEach( elements, element => {
		if ( element === unhiddenElement ) {
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
	forEach( hiddenElements, element => {
		element.removeAttribute( 'aria-hidden' );
	} );
	hiddenElements = [];
	isHidden = false;
}
