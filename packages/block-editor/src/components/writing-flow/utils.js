/**
 *
 * Detects if element is a form element.
 *
 * @param {Element} element The element to check.
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
