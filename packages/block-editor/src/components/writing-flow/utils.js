/** @typedef {import('@wordpress/element').RefObject} RefObject */

/**
 *
 * Detects if element is a form element.
 *
 * @param {RefObject} element The element to check.
 *
 * @return {boolean} True if form element and false otherwise.
 */
export function isFormElement( element ) {
	const { tagName } = element;
	return (
		tagName === 'INPUT' ||
		tagName === 'BUTTON' ||
		tagName === 'SELECT' ||
		tagName === 'TEXTAREA'
	);
}
