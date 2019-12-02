/**
 * @param {Element} [element]
 * @return {boolean} Whether `element` is body
 */
export default function isBodyElement( element ) {
	return element && element.tagName === 'BODY';
}
