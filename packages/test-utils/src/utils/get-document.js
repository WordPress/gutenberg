/**
 * @param {Element} [element]
 * @return {Document} Document
 */
export default function getDocument( element ) {
	return element ?
		element.ownerDocument || window.document :
		window.document;
}
