/**
 * Internal dependencies
 */
import documentHasTextSelection from './document-has-text-selection';
import inputFieldHasUncollapsedSelection from './input-field-has-uncollapsed-selection';

/**
 * Check whether the current document has any sort of selection. This includes
 * ranges of text across elements and any selection inside `<input>` and
 * `<textarea>` elements.
 *
 * @param {Document} doc The document to check.
 *
 * @return {boolean} Whether there is any sort of "selection" in the document.
 */
export default function documentHasUncollapsedSelection( doc ) {
	return (
		documentHasTextSelection( doc ) ||
		( !! doc.activeElement &&
			inputFieldHasUncollapsedSelection( doc.activeElement ) )
	);
}
