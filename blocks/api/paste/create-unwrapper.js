/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

function unwrap( node ) {
	const parent = node.parentNode;

	while ( node.firstChild ) {
		parent.insertBefore( node.firstChild, node );
	}

	parent.removeChild( node );
}

export default function( predicate ) {
	return ( node ) => {
		if ( node.nodeType !== ELEMENT_NODE ) {
			return;
		}

		if ( ! predicate( node ) ) {
			return;
		}

		unwrap( node );
	};
}
