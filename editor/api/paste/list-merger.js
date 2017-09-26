/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

export default function( node ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	const type = node.nodeName;

	if ( type !== 'OL' && type !== 'UL' ) {
		return;
	}

	if ( node.children.length !== 1 ) {
		return;
	}

	const prevElement = node.previousElementSibling;

	if ( ! prevElement || prevElement.nodeName !== type ) {
		return;
	}

	prevElement.appendChild( node.firstChild );
	node.parentNode.removeChild( node );
}
