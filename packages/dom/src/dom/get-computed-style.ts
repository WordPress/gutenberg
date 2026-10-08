import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * @param element
 * @return The computed style for the element.
 */
export default function getComputedStyle(
	element: Element
): ReturnType< Window[ 'getComputedStyle' ] > {
	assertIsDefined(
		element.ownerDocument.defaultView,
		'element.ownerDocument.defaultView'
	);
	return element.ownerDocument.defaultView.getComputedStyle( element );
}
