/**
 * @param {Element} element
 * @return {element is HTMLInputElement | HTMLTextAreaElement} Whether the element is an input or textarea
 */
export default function isInputOrTextArea( element ) {
	return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
}
