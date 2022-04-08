/**
 * Internal dependencies
 */
import isTextField from './is-text-field';
import isHTMLInputElement from './is-html-input-element';

/**
 * Check whether the given element, assumed an input field or textarea,
 * contains a (uncollapsed) selection of text.
 *
 * Note: this is perhaps an abuse of the term "selection", since these elements
 * manage selection differently and aren't covered by Selection#collapsed.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection#Related_objects.
 *
 * @param {Element} element The HTML element.
 *
 * @return {boolean} Whether the input/textareaa element has some "selection".
 */
export default function inputFieldHasUncollapsedSelection( element ) {
	if ( ! isTextField( element ) && ! isHTMLInputElement( element ) ) {
		return false;
	}

	// Unfortunately, the HTML spec states that the `selectionStart` and
	// `selectionEnd` attributes of `input` elements DO NOT APPLY to most
	// non-text input types. This effectively means that we cannot inspect the
	// selection state of numeric inputs, even email inputs, etc.
	//
	// The trade-off that this function makes is to assume that any such opaque
	// element always has an uncollapsed selection. This should cause the block
	// editor to defer to the browser's native selection handling (e.g. copying
	// and pasting), thereby reducing friction for the user.
	//
	// See: https://html.spec.whatwg.org/multipage/input.html#do-not-apply
	if ( ! isTextField( element ) ) {
		return true;
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
