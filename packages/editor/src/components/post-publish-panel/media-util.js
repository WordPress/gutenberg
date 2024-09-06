/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { getFilename } from '@wordpress/url';

// Generate a list of unique filenames given a list of URLs.
// We want all basenames to be unique, since sometimes the extension
// doesn't reflect the mime type, and may end up getting changed by
// the server, on upload.
export function generateUniqueFilenames( urls ) {
	const basenames = new Set();

	return urls.map( ( url ) => {
		// We prefer to match the remote filename, if possible.
		const filename = getFilename( url );
		let basename = '';
		let extension = '';

		if ( filename ) {
			const parts = filename.split( '.' );
			if ( parts.length > 1 ) {
				// Assume the last part is the extension.
				extension = parts.pop();
			}
			basename = parts.join( '.' );
		}

		if ( ! basename ) {
			// It looks like we don't have a basename, so let's use a UUID.
			basename = uuid();
		}

		if ( basenames.has( basename ) ) {
			// Append a UUID to deduplicate the basename.
			// The server will try to deduplicate on its own if we don't do this,
			// but it may run into a race condition
			// (see https://github.com/WordPress/gutenberg/issues/64899).
			// Deduplicating the filenames before uploading is safer.
			basename = `${ basename }-${ uuid() }`;
		}

		basenames.add( basename );

		return { url, basename, extension };
	} );
}

const mimeTypeToExtension = {
	'image/apng': 'apng',
	'image/avif': 'avif',
	'image/bmp': 'bmp',
	'image/gif': 'gif',
	'image/vnd.microsoft.icon': 'ico',
	'image/jpeg': 'jpg',
	'image/jxl': 'jxl',
	'image/png': 'png',
	'image/svg+xml': 'svg',
	'image/tiff': 'tiff',
	'image/webp': 'webp',
	'video/x-msvideo': 'avi',
	'video/mp4': 'mp4',
	'video/mpeg': 'mpeg',
	'video/ogg': 'ogg',
	'video/mp2t': 'ts',
	'video/webm': 'webm',
	'video/3gpp': '3gp',
	'video/3gpp2': '3g2',
};

// Get the file extension to use for a given mime type.
export function getExtensionFromMimeType( mime ) {
	mime = ( mime ?? '' ).toLowerCase();

	let extension = mimeTypeToExtension[ mime ];

	if ( ! extension ) {
		// We don't know which extension to use, so we need to fall back to
		// something safe. The server should replace it with an appropriate
		// extension for the mime type.
		if ( mime.startsWith( 'image/' ) ) {
			extension = 'png';
		}
		if ( mime.startsWith( 'video/' ) ) {
			extension = 'mp4';
		}
	}

	// If all else fails, try an empty extension.
	// The server will probably reject the upload, but there isn't much
	// else we can do.
	return extension || '';
}

// Returns an array of { url, filePromise } objects, where the promise
// points to a file built from a fetched blob. Filenames should be unique.
export function fetchMedia( urls ) {
	return generateUniqueFilenames( urls ).map(
		( { url, basename, extension } ) => {
			const filePromise = window
				.fetch( url.includes( '?' ) ? url : url + '?' )
				.then( ( response ) => response.blob() )
				.then( ( blob ) => {
					// Not all remote filenames have an extension, but we need to
					// provide one, or the server is likely to reject the upload.
					if ( ! extension ) {
						extension = getExtensionFromMimeType( blob.type );
					}
					return new File( [ blob ], `${ basename }.${ extension }`, {
						type: blob.type,
					} );
				} );

			return { url, filePromise };
		}
	);
}
