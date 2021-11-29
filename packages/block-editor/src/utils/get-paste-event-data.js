/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';
import { getFilesFromDataTransfer } from '@wordpress/dom';

export function getPasteEventData( { clipboardData } ) {
	let plainText = '';
	let html = '';

	// IE11 only supports `Text` as an argument for `getData` and will
	// otherwise throw an invalid argument error, so we try the standard
	// arguments first, then fallback to `Text` if they fail.
	try {
		plainText = clipboardData.getData( 'text/plain' );
		html = clipboardData.getData( 'text/html' );
	} catch ( error1 ) {
		try {
			html = clipboardData.getData( 'Text' );
		} catch ( error2 ) {
			// Some browsers like UC Browser paste plain text by default and
			// don't support clipboardData at all, so allow default
			// behaviour.
			return;
		}
	}

	const files = getFilesFromDataTransfer(
		clipboardData
	).filter( ( { type } ) => /^image\/(?:jpe?g|png|gif|webp)$/.test( type ) );

	// Only process files if no HTML is present.
	// A pasted file may have the URL as plain text.
	if ( files.length && ! html ) {
		html = files
			.map( ( file ) => `<img src="${ createBlobURL( file ) }">` )
			.join( '' );
		plainText = '';
	}

	return { html, plainText };
}
