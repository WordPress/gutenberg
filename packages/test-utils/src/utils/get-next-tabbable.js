/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import mockClientRects from './mock-client-rects';
import getDocument from './get-document';
import getActiveElement from './get-active-element';

/**
 * @param {Element} element
 * @return {Element} Next tabbable element
 */
export default function getNextTabbable( element ) {
	const restoreClientRects = mockClientRects();
	const tabbableElements = focus.tabbable.find( getDocument( element ) );
	const currentIndex = tabbableElements.indexOf( getActiveElement( element ) );
	const nextIndex = currentIndex + 1;
	restoreClientRects();
	return nextIndex >= tabbableElements.length ?
		tabbableElements[ 0 ] :
		tabbableElements[ nextIndex ];
}
