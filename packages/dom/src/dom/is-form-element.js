/**
 * Internal dependencies
 */
import isInputOrTextArea from './is-input-or-text-area';

/**
 * Detects if element is a form element.
 *
 * @param {Element}                                       element The element to check.
 * @param {{ __unstableIncludeContentEditable: boolean }} options Options object.
 *
 * @return {boolean} True if form element and false otherwise.
 */
export default function isFormElement(
	element,
	options = { __unstableIncludeContentEditable: false }
) {
	if ( ! element ) {
		return false;
	}

	const { tagName } = element;
	const checkForInputTextarea = isInputOrTextArea( element );
	const checkContentEditable =
		options.__unstableIncludeContentEditable &&
		element?.getAttribute( 'contenteditable' ) === 'true'
			? true
			: false;
	return (
		checkForInputTextarea ||
		tagName === 'BUTTON' ||
		tagName === 'SELECT' ||
		checkContentEditable
	);
}
