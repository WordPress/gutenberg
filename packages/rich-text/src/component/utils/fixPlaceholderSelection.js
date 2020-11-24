/**
 * If the selection is set on the placeholder element, collapse the selection to
 * the start (before the placeholder).
 *
 * @param {Window} defaultView
 */
export function fixPlaceholderSelection( defaultView ) {
	const selection = defaultView.getSelection();
	const { anchorNode, anchorOffset } = selection;

	if ( anchorNode.nodeType !== anchorNode.ELEMENT_NODE ) {
		return;
	}

	const targetNode = anchorNode.childNodes[ anchorOffset ];

	if (
		! targetNode ||
		targetNode.nodeType !== targetNode.ELEMENT_NODE ||
		! targetNode.getAttribute( 'data-rich-text-placeholder' )
	) {
		return;
	}

	selection.collapseToStart();
}
