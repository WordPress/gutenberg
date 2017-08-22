const attributes = [
	'style',
	'class',
	'id',
];

export default function( node ) {
	if ( node.nodeType !== 1 ) {
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
