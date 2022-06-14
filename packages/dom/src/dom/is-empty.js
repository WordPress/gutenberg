/**
 * Recursively checks if an element is empty. An element is not empty if it
 * contains text or contains elements with attributes such as images.
 *
 * @param {Element} element The element to check.
 *
 * @return {boolean} Whether or not the element is empty.
 */
export default function isEmpty( element ) {
	switch ( element.nodeType ) {
		case element.TEXT_NODE:
			// We cannot use \s since it includes special spaces which we want
			// to preserve.
			return /^[ \f\n\r\t\v\u00a0]*$/.test( element.nodeValue || '' );
		case element.ELEMENT_NODE:
			if ( element.hasAttributes() ) {
				return false;
			} else if ( ! element.hasChildNodes() ) {
				return true;
			}

			return /** @type {Element[]} */ (
				Array.from( element.childNodes )
			).every( isEmpty );
		default:
			return true;
	}
}
