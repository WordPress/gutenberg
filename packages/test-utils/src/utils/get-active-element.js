/**
 * Internal dependencies
 */
import getDocument from './get-document';

/**
 * @param {Element} [element]
 * @return {Element} Active Element
 */
export default function getActiveElement( element ) {
	return getDocument( element ).activeElement;
}
