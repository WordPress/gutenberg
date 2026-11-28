import documentHasTextSelection from './document-has-text-selection';
import inputFieldHasUncollapsedSelection from './input-field-has-uncollapsed-selection';

/**
 * Check whether the current document has any sort of (uncollapsed) selection.
 * This includes ranges of text across elements and any selection inside
 * textual `<input>` and `<textarea>` elements.
 *
 * @param doc The document to check.
 *
 * @return Whether there is any recognizable text selection in the document.
 */
export default function documentHasUncollapsedSelection(
	doc: Document
): boolean {
	return (
		documentHasTextSelection( doc ) ||
		( !! doc.activeElement &&
			inputFieldHasUncollapsedSelection( doc.activeElement ) )
	);
}
