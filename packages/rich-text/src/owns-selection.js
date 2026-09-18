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

	// Check the selection before the editing host. When the host is the canvas
	// wrapper it contains every editable element, so the host checks pass for
	// all of them and only the selection tells them apart. Running the
	// discriminating check first lets a non-owning instance bail before the
	// host checks.
	const selection = ownerDocument.defaultView.getSelection();
	const { anchorNode, focusNode } = selection;

	if (
		! anchorNode ||
		! focusNode ||
		! element.contains( anchorNode ) ||
		! element.contains( focusNode )
	) {
		return false;
	}

	return (
		activeElement.contentEditable === 'true' &&
		element.contentEditable === 'true' &&
		activeElement.contains( element )
	);
}
