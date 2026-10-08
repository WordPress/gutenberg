import isInputOrTextArea from './is-input-or-text-area';

/**
 *
 * Detects if element is a form element.
 *
 * @param element The element to check.
 *
 * @return True if form element and false otherwise.
 */
export default function isFormElement( element: Element ): boolean {
	if ( ! element ) {
		return false;
	}

	const { tagName } = element;
	const checkForInputTextarea = isInputOrTextArea( element );
	return (
		checkForInputTextarea || tagName === 'BUTTON' || tagName === 'SELECT'
	);
}
