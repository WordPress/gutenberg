/**
 * Internal dependencies
 */
import isInputOrTextArea from './is-input-or-text-area';

/**
 *
 * Detects if element is a form element.
 *
 * @param {Element} element                The element to check.
 * @param {boolean} includeContentEditable Rather or not to include elements with contentEditable attribute.
 *
 * @return {boolean} True if form element and false otherwise.
 */
export default function isFormElement(
	element,
	includeContentEditable = false
) {
	const { tagName } = element;
	const checkForInputTextarea = isInputOrTextArea( element );
	let checkContentEditable = false;
	if (
		includeContentEditable &&
		element.getAttribute( 'contentEditable' ) === 'true'
	) {
		checkContentEditable = true;
	}
	return (
		checkForInputTextarea ||
		tagName === 'BUTTON' ||
		tagName === 'SELECT' ||
		checkContentEditable
	);
}
