const attributes = [
	'style',
	'class',
	'id',
];

export default function( nodes ) {
	const fragment = document.createDocumentFragment();

	nodes.forEach( node => fragment.appendChild( node.cloneNode( true ) ) );

	deepAttributeStrip( fragment.children );

	return Array.from( fragment.childNodes );
}

function deepAttributeStrip( nodes ) {
	Array.from( nodes ).forEach( ( node ) => {
		if ( node.hasAttributes() ) {
			Array.from( node.attributes ).forEach( ( { name } ) => {
				if ( attributes.indexOf( name ) !== -1 ) {
					node.removeAttribute( name );
				}

				if ( name.indexOf( 'data-' ) === 0 ) {
					node.removeAttribute( name );
				}
			} );
		}

		deepAttributeStrip( node.children );
	} );
}
