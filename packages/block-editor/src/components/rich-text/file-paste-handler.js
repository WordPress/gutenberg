/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';

export function filePasteHandler( files ) {
	return files
		.filter( ( { type } ) => /^image\/(?:jpe?g|png|gif)$/.test( type ) )
		.map( ( file ) => `<img src="${ createBlobURL( file ) }">` )
		.join( '' );
}
