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

export default function( predicate, after ) {
	return ( node ) => {
		if ( node.nodeType !== ELEMENT_NODE ) {
			return;
		}

		if ( ! predicate( node ) ) {
			return;
		}

		const afterNode = after && after( node );

		if ( afterNode ) {
			node.appendChild( afterNode );
		}

		unwrap( node );
	};
}
