/**
 * Internal dependencies
 */
import isTextField from './is-text-field';
import isNumberInput from './is-number-input';
import documentHasTextSelection from './document-has-text-selection';

/**
 * Check whether the current document has a selection. This checks for both
 * focus in an input field and general text selection.
 *
 * @param {Document} doc The document to check.
 *
 * @return {boolean} True if there is selection, false if not.
 */
export default function documentHasSelection( doc ) {
	return (
		!! doc.activeElement &&
		( isTextField( doc.activeElement ) ||
			isNumberInput( doc.activeElement ) ||
			documentHasTextSelection( doc ) )
	);
}
