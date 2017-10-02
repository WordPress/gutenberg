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

	if ( node.src.indexOf( 'file:' ) === 0 ) {
		node.src = '';
	}

	// Remove trackers and hardly visible images.
	if ( node.height === 1 || node.width === 1 ) {
		node.parentNode.removeChild( node );
	}
}
