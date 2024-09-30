export default function anchorReducer( node ) {
	if ( node.nodeName === 'A' ) {
		// In jsdom-jscore, 'node.target' can be null.
		// TODO: Explore fixing this by patching jsdom-jscore.
		if ( node.target && node.target.toLowerCase() === '_blank' ) {
			node.rel = 'noreferrer noopener';
		} else {
			node.removeAttribute( 'target' );
			node.removeAttribute( 'rel' );
		}

		// Saves anchor elements name attribute as id
		if ( node.name && ! node.id ) {
			node.id = node.name;
		}

		// Keeps id only if there is an internal link pointing to it
		if (
			node.id &&
			! node.ownerDocument.querySelector( `[href="#${ node.id }"]` )
		) {
			node.removeAttribute( 'id' );
		}
	}
}
