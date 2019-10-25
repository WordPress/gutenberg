/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';

export function filePasteHandler( files, html ) {
	// Only process file if no HTML is present.
	// Note: a pasted file may have the URL as plain text.
	if ( html || files.length === 0 ) {
		return undefined;
	}

	// eslint-disable-next-line no-console
	window.console.log( 'Received items:\n\n', files );

	return files
		.filter( ( { type } ) => /^image\/(?:jpe?g|png|gif)$/.test( type ) )
		.map( ( file ) => `<img src="${ createBlobURL( file ) }">` )
		.join( '' );
}
