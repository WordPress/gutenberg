/**
 * Removes empty paragraph elements.
 *
 * @param node Node to check.
 */
export default function emptyParagraphRemover( node: Node ): void {
	if ( node.nodeName !== 'P' ) {
		return;
	}

	if ( node.hasChildNodes() ) {
		return;
	}

	node.parentNode!.removeChild( node );
}
