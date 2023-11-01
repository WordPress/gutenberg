/**
 * Replaces Slack paragraph markup with a double line break (later converted to
 * a proper paragraph).
 *
 * @param {Element} node Node to check.
 */
export default function slackParagraphCorrector( node ) {
	if ( node.nodeName !== 'SPAN' ) {
		return;
	}

	if ( node.getAttribute( 'data-stringify-type' ) !== 'paragraph-break' ) {
		return;
	}

	const { parentNode } = node;

	parentNode.insertBefore( node.ownerDocument.createElement( 'br' ), node );
	parentNode.insertBefore( node.ownerDocument.createElement( 'br' ), node );
	parentNode.removeChild( node );
}
