/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';

export function filePasteHandler( images, html ) {
	if ( ! html && images.length > 0 ) {
		let filesHTML = '';
		images.forEach( ( image ) => {
			const file = image.getAsFile ? image.getAsFile() : image;
			window.console.log( 'Received item:\n\n', file );
			filesHTML += `<img src="${ createBlobURL( file ) }">`;
		} );
		return filesHTML;
	}
	return undefined;
}
