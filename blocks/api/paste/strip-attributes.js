/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

const attributes = {
	img: [ 'src', 'alt' ],
	a: [ 'href' ],
};

export default function( node ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	if ( ! node.hasAttributes() ) {
		return;
	}

	const tag = node.nodeName.toLowerCase();

	Array.from( node.attributes ).forEach( ( { name } ) => {
		if ( attributes[ tag ] && attributes[ tag ].indexOf( name ) !== -1 ) {
			return;
		}

		node.removeAttribute( name );
	} );
}
