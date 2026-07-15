/**
 * Returns true when the element owns the document selection: either the
 * element itself has focus, or its contentEditable editing host has focus
 * (e.g. an editable block editor canvas wrapper) and the selection is fully
 * contained within the element.
 *
 * @param {HTMLElement} element The editable element.
 *
 * @return {boolean} Whether the element owns the document selection.
 */
export function ownsSelection( element ) {
	const { ownerDocument } = element;
	const { activeElement } = ownerDocument;

	if ( activeElement === element ) {
		return true;
	}

	if (
		! activeElement ||
		! activeElement.isContentEditable ||
		! element.isContentEditable ||
		! activeElement.contains( element )
	) {
		return false;
	}

	const selection = ownerDocument.defaultView.getSelection();
	const { anchorNode, focusNode } = selection;

	return (
		!! anchorNode &&
		!! focusNode &&
		element.contains( anchorNode ) &&
		element.contains( focusNode )
	);
}
