/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

export default function( node ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	if ( node.nodeName !== 'IMG' ) {
		return;
	}

	if ( node.src.indexOf( 'file:' ) !== 0 ) {
		return;
	}

	node.src = '';
}
