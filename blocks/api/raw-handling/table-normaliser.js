/**
 * Browser dependencies
 */
const { TEXT_NODE } = window.Node;

export default function( node ) {
	if ( node.nodeType !== TEXT_NODE ) {
		return;
	}

	const parentNode = node.parentNode;

	if ( [ 'TR', 'TBODY', 'THEAD', 'TFOOT', 'TABLE' ].indexOf( parentNode.nodeName ) === -1 ) {
		return;
	}

	parentNode.removeChild( node );
}
