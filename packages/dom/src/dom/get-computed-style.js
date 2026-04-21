/**
 * Internal dependencies
 */
import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * @param {Element} element
 * @return {ReturnType<Window['getComputedStyle']>} The computed style for the element.
 */
export default function getComputedStyle( element ) {
	assertIsDefined(
		element.ownerDocument.defaultView,
		'element.ownerDocument.defaultView'
	);
	return element.ownerDocument.defaultView.getComputedStyle( element );
}
