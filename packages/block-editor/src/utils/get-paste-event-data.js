/**
 * External dependencies
 */
import { find, isNil } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';

export function getPasteEventData( { clipboardData } ) {
	let { items, files } = clipboardData;

	// In Edge these properties can be null instead of undefined, so a more
	// rigorous test is required over using default values.
	items = isNil( items ) ? [] : items;
	files = isNil( files ) ? [] : files;

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

	files = Array.from( files );

	Array.from( items ).forEach( ( item ) => {
		if ( ! item.getAsFile ) {
			return;
		}

		const file = item.getAsFile();

		if ( ! file ) {
			return;
		}

		const { name, type, size } = file;

		if ( ! find( files, { name, type, size } ) ) {
			files.push( file );
		}
	} );

	files = files.filter( ( { type } ) =>
		/^image\/(?:jpe?g|png|gif)$/.test( type )
	);

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
