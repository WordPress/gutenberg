/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

function replace( node, tagName ) {
	const newNode = document.createElement( tagName );

	while ( node.firstChild ) {
		newNode.appendChild( node.firstChild );
	}

	node.parentNode.replaceChild( newNode, node );
}

export default function( node ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	if ( node.nodeName === 'SPAN' ) {
		const fontWeight = node.style.fontWeight;
		const fontStyle = node.style.fontStyle;

		if ( fontWeight === 'bold' || fontWeight === '700' ) {
			replace( node, 'strong' );
		} else if ( fontStyle === 'italic' ) {
			replace( node, 'em' );
		}
	}

	if ( node.nodeName === 'B' ) {
		replace( node, 'strong' );
	}

	if ( node.nodeName === 'I' ) {
		replace( node, 'em' );
	}
}
