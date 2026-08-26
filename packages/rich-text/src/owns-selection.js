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

	// Read the `contentEditable` attribute, not `isContentEditable`: the latter
	// computes the effective editable state and forces a style and layout tree
	// update. Since each editable element checks this on every keystroke, that
	// forced update would scale with the number of blocks in the post. The
	// editing host and the editable both set the attribute explicitly, so the
	// attribute is equivalent here.
	if (
		! activeElement ||
		activeElement.contentEditable !== 'true' ||
		element.contentEditable !== 'true' ||
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
