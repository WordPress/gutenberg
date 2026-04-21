/**
 * Internal dependencies
 */
import isTextField from './is-text-field';
import isHTMLInputElement from './is-html-input-element';
import documentHasTextSelection from './document-has-text-selection';

/**
 * Check whether the current document has a selection. This includes focus in
 * input fields, textareas, and general rich-text selection.
 *
 * @param {Document} doc The document to check.
 *
 * @return {boolean} True if there is selection, false if not.
 */
export default function documentHasSelection( doc ) {
	return (
		!! doc.activeElement &&
		( isHTMLInputElement( doc.activeElement ) ||
			isTextField( doc.activeElement ) ||
			documentHasTextSelection( doc ) )
	);
}
