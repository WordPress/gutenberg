/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
/**
 * Internal dependencies
 */
import mockClientRects from './mock-client-rects';

/**
 * @param {Element} element
 * @return {boolean} Whether `element` is focusable
 */
export default function isFocusable( element ) {
	if ( ! element.parentElement ) {
		return false;
	}
	const restoreClientRects = mockClientRects();
	const focusableElements = focus.focusable.find( element.parentElement );
	restoreClientRects();
	return focusableElements.indexOf( element ) !== -1;
}
