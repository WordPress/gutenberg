/* eslint-disable jsdoc/valid-types */
/**
 * @param {Element} element
 * @return {element is HTMLInputElement | HTMLTextAreaElement} Whether the element is an input or textarea
 */
export default function isInputOrTextArea( element ) {
	/* eslint-enable jsdoc/valid-types */
	return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
}
