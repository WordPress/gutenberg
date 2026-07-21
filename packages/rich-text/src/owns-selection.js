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

	if ( ! activeElement ) {
		return false;
	}

	// Test the selection before the editing host. When the host is the
	// editable canvas wrapper it contains every instance, so the host checks
	// pass for all of them and only the selection discriminates. Reading
	// `isContentEditable` also forces a style and layout tree update, so it
	// is kept off the path that every unrelated instance walks.
	const selection = ownerDocument.defaultView?.getSelection();
	const anchorNode = selection?.anchorNode;
	const focusNode = selection?.focusNode;

	if (
		! anchorNode ||
		! focusNode ||
		! element.contains( anchorNode ) ||
		! element.contains( focusNode )
	) {
		return false;
	}

	return (
		activeElement.isContentEditable &&
		element.isContentEditable &&
		activeElement.contains( element )
	);
}
