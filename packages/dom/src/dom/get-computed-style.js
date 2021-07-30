/**
 * Internal dependencies
 */
import { assertIsDefined } from '../utils/assert-is-defined';

/* eslint-disable jsdoc/valid-types */
/**
 * @param {Element} element
 * @return {ReturnType<Window['getComputedStyle']>} The computed style for the element.
 */
export default function getComputedStyle( element ) {
	/* eslint-enable jsdoc/valid-types */
	assertIsDefined(
		element.ownerDocument.defaultView,
		'element.ownerDocument.defaultView'
	);
	return element.ownerDocument.defaultView.getComputedStyle( element );
}
