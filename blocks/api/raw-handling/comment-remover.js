/**
 * Browser dependencies
 */
const { COMMENT_NODE } = window.Node;

export default function( node ) {
	if ( node.nodeType !== COMMENT_NODE ) {
		return;
	}

	node.parentNode.removeChild( node );
}
