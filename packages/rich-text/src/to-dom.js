/**
 * Gets a node given a path (array of indices) from the given node.
 *
 * @param {HTMLElement} node Root node to find the wanted node in.
 * @param {Array}       path Path (indices) to the wanted node.
 *
 * @return {Object} Object with the found node and the remaining offset (if any).
 */
function getNodeByPath( node, path ) {
	path = [ ...path ];

	while ( node && path.length > 1 ) {
		node = node.childNodes[ path.shift() ];
	}

	return {
		node,
		offset: path[ 0 ],
	};
}

/**
 * Returns true if two ranges are equal, or false otherwise. Ranges are
 * considered equal if their start and end occur in the same container and
 * offset.
 *
 * @param {Range} a First range object to test.
 * @param {Range} b First range object to test.
 *
 * @return {boolean} Whether the two ranges are equal.
 */
function isRangeEqual( a, b ) {
	return (
		a.startContainer === b.startContainer &&
		a.startOffset === b.startOffset &&
		a.endContainer === b.endContainer &&
		a.endOffset === b.endOffset
	);
}

export function applySelection( { startPath, endPath }, current ) {
	const { node: startContainer, offset: startOffset } = getNodeByPath( current, startPath );
	const { node: endContainer, offset: endOffset } = getNodeByPath( current, endPath );
	const selection = window.getSelection();
	const { ownerDocument } = current;
	const range = ownerDocument.createRange();

	range.setStart( startContainer, startOffset );
	range.setEnd( endContainer, endOffset );

	if ( selection.rangeCount > 0 ) {
		// If the to be added range and the live range are the same, there's no
		// need to remove the live range and add the equivalent range.
		if ( isRangeEqual( range, selection.getRangeAt( 0 ) ) ) {
			// Set back focus if focus is lost.
			if ( ownerDocument.activeElement !== current ) {
				current.focus();
			}

			return;
		}

		selection.removeAllRanges();
	}

	selection.addRange( range );
}
