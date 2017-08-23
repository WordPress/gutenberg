/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

const attributes = [
	'style',
	'class',
	'id',
	// To do: keep rtl value?
	'dir',
];

export default function( node ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	if ( ! node.hasAttributes() ) {
		return;
	}

	Array.from( node.attributes ).forEach( ( { name } ) => {
		if ( attributes.indexOf( name ) !== -1 ) {
			node.removeAttribute( name );
		}

		if ( name.indexOf( 'data-' ) === 0 ) {
			node.removeAttribute( name );
		}
	} );
}
