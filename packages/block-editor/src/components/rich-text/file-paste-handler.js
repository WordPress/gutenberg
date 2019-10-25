/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';

export function filePasteHandler( images, html ) {
	if ( html || images.length === 0 ) {
		return undefined;
	}
	let filesHTML = '';
	images.forEach( ( image ) => {
		const file = image.getAsFile ? image.getAsFile() : image;
		// eslint-disable-next-line no-console
		window.console.log( 'Received item:\n\n', file );
		filesHTML += `<img src="${ createBlobURL( file ) }">`;
	} );
	return filesHTML;
}
