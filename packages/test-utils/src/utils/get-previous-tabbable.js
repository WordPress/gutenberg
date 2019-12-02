/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
/**
 * Internal dependencies
 */
import './mock-client-rects';
import getDocument from './get-document';
import getActiveElement from './get-active-element';

/**
 * @param {Element} element
 * @return {Element} Previous tabbable element
 */
export default function getPreviousTabbable( element ) {
	const tabbableElements = focus.tabbable.find( getDocument( element ) );
	const currentIndex = tabbableElements.indexOf( getActiveElement( element ) );
	const previousIndex = currentIndex - 1;
	return previousIndex < 0 ?
		tabbableElements[ tabbableElements.length - 1 ] :
		tabbableElements[ previousIndex ];
}
