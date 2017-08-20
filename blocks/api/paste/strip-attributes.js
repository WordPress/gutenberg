const attributes = [
	'style',
	'class',
	'id',
];

export default function( HTML ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	deepAttributeStrip( doc.body.children );

	return doc.body.innerHTML;
}

function deepAttributeStrip( nodeList ) {
	Array.from( nodeList ).forEach( ( node ) => {
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
