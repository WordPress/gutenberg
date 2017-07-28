export default function( nodes ) {
	// MUTATION!
	nodes.forEach( deepAttributeStrip );
	return nodes;
}

function deepAttributeStrip( node ) {
	node.removeAttribute( 'style' );
	node.removeAttribute( 'class' );
	node.removeAttribute( 'id' );
	Array.from( node.children ).forEach( deepAttributeStrip );
}
