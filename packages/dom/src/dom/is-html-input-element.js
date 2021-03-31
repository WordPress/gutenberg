/* eslint-disable jsdoc/valid-types */
/**
 * @param {Element | null | undefined} element
 * @return {element is HTMLInputElement} Whether the element is an HTMLInputElement.
 */
export default function isHTMLInputElement( element ) {
	/* eslint-enable jsdoc/valid-types */
	return !! element && element.nodeName === 'INPUT';
}
