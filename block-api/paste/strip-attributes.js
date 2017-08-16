import { ELEMENT_NODE } from 'utils/nodetypes';

export default function( nodes ) {
	// MUTATION!
	nodes.forEach( deepAttributeStrip );
	return nodes;
}

function deepAttributeStrip( node ) {
	if ( ELEMENT_NODE === node.nodeType ) {
		node.removeAttribute( 'style' );
		node.removeAttribute( 'class' );
		node.removeAttribute( 'id' );
		Array.from( node.children ).forEach( deepAttributeStrip );
	}
}
