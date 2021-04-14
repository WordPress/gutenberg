/**
 * Internal dependencies
 */
import isTextField from './is-text-field';
import isNumberInput from './is-number-input';

/**
 * Check whether the given element, assumed an input field or textarea,
 * contains a (uncollapsed) selection of text.
 *
 * Note: this is perhaps an abuse of the term "selection", since these elements
 * manage selection differently and aren't covered by Selection#collapsed.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection#Related_objects.
 *
 * @param {HTMLElement} element The HTML element.
 *
 * @return {boolean} Whether the input/textareaa element has some "selection".
 */
export default function inputFieldHasUncollapsedSelection( element ) {
	if ( ! isTextField( element ) && ! isNumberInput( element ) ) {
		return false;
	}
	try {
		const {
			selectionStart,
			selectionEnd,
		} = /** @type {HTMLInputElement | HTMLTextAreaElement} */ ( element );

		return selectionStart !== null && selectionStart !== selectionEnd;
	} catch ( error ) {
		// Safari throws an exception when trying to get `selectionStart`
		// on non-text <input> elements (which, understandably, don't
		// have the text selection API). We catch this via a try/catch
		// block, as opposed to a more explicit check of the element's
		// input types, because of Safari's non-standard behavior. This
		// also means we don't have to worry about the list of input
		// types that support `selectionStart` changing as the HTML spec
		// evolves over time.
		return false;
	}
}
