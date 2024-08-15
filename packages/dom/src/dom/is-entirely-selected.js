/**
 * Internal dependencies
 */
import isInputOrTextArea from './is-input-or-text-area';

/**
 * Check whether the contents of the element have been entirely selected.
 * Returns true if there is no possibility of selection.
 *
 * @param {HTMLElement} element The element to check.
 *
 * @return {boolean} True if entirely selected, false if not.
 */
export default function isEntirelySelected( element ) {
	if ( isInputOrTextArea( element ) ) {
		return (
			element.selectionStart === 0 &&
			element.value.length === element.selectionEnd
		);
	}

	if ( ! element.isContentEditable ) {
		return true;
	}

	const { ownerDocument } = element;
	const { defaultView } = ownerDocument;

	if ( ! defaultView ) {
		return false;
	}

	const selection = defaultView.getSelection();

	if ( ! selection ) {
		return false;
	}

	return element.textContent === selection.toString();
}
