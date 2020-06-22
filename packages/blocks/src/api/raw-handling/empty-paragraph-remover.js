/**
 * Removes empty paragraph elements.
 *
 * @param {Element} node Node to check.
 */
export default function emptyParagraphRemover( node ) {
	if ( node.nodeName !== 'P' ) {
		return;
	}

	if ( node.hasChildNodes() ) {
		return;
	}

	node.parentNode.removeChild( node );
}
