import { v4 as uuid } from 'uuid';
import { createBlobURL } from '@wordpress/blob';

export default function imageCorrector( img: Node ): void {
	if ( img.nodeName !== 'IMG' ) {
		return;
	}

	const node = img as HTMLImageElement;

	if ( node.src.indexOf( 'file:' ) === 0 ) {
		node.src = '';
	}

	// This piece cannot be tested outside a browser env.
	if ( node.src.indexOf( 'data:' ) === 0 ) {
		const [ properties, data ] = node.src.split( ',' );
		const [ type ] = properties.slice( 5 ).split( ';' );

		if ( ! data || ! type ) {
			node.src = '';
			return;
		}

		let decoded;

		// Can throw DOMException!
		try {
			decoded = atob( data );
		} catch {
			node.src = '';
			return;
		}

		const uint8Array = new Uint8Array( decoded.length );

		for ( let i = 0; i < uint8Array.length; i++ ) {
			uint8Array[ i ] = decoded.charCodeAt( i );
		}

		// Each pasted image needs its own filename: images pasted together are
		// uploaded concurrently, and identical names race in the server's
		// unique filename check, so one upload can overwrite another.
		const subtype = type.slice( type.indexOf( '/' ) + 1 );
		const name = `image-${ uuid().slice( 0, 8 ) }.${ subtype }`;
		const file = new window.File( [ uint8Array ], name, { type } );

		node.src = createBlobURL( file );
	}

	// Remove trackers and hardly visible images.
	if ( node.height === 1 || node.width === 1 ) {
		node.parentNode!.removeChild( node );
	}
}
