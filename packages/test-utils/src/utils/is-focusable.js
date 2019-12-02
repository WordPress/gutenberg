/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
/**
 * Internal dependencies
 */
import './mock-client-rects';
import getDocument from './get-document';

/**
 * @param {Element} element
 * @return {boolean} Whether `element` is focusable
 */
export default function isFocusable( element ) {
	const document = getDocument( element );
	const focusableElements = focus.focusable.find( document );
	return focusableElements.indexOf( element ) !== -1;
}
