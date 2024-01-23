/**
 * Internal dependencies
 */
import isTextField from './is-text-field';
import isHTMLInputElement from './is-html-input-element';

/**
 * Check whether the given input field or textarea contains a (uncollapsed)
 * selection of text.
 *
 * CAVEAT: Only specific text-based HTML inputs support the selection APIs
 * needed to determine whether they have a collapsed or uncollapsed selection.
 * This function defaults to returning `true` when the selection cannot be
 * inspected, such as with `<input type="time">`. The rationale is that this
 * should cause the block editor to defer to the browser's native selection
 * handling (e.g. copying and pasting), thereby reducing friction for the user.
 *
 * See: https://html.spec.whatwg.org/multipage/input.html#do-not-apply
 *
 * @param {Element} element The HTML element.
 *
 * @return {boolean} Whether the input/textareaa element has some "selection".
 */
export default function inputFieldHasUncollapsedSelection( element ) {
	if ( ! isHTMLInputElement( element ) && ! isTextField( element ) ) {
		return false;
	}

	// Safari throws a type error when trying to get `selectionStart` and
	// `selectionEnd` on non-text <input> elements, so a try/catch construct is
	// necessary.
	try {
		const { selectionStart, selectionEnd } =
			/** @type {HTMLInputElement | HTMLTextAreaElement} */ ( element );
		return (
			// `null` means the input type doesn't implement selection, thus we
			// cannot determine whether the selection is collapsed, so we
			// default to true.
			selectionStart === null ||
			// when not null, compare the two points
			selectionStart !== selectionEnd
		);
	} catch ( error ) {
		// This is Safari's way of saying that the input type doesn't implement
		// selection, so we default to true.
		return true;
	}
}
