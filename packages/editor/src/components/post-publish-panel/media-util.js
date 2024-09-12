/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { getFilename } from '@wordpress/url';

/**
 * Generate a list of unique basenames given a list of URLs.
 *
 * We want all basenames to be unique, since sometimes the extension
 * doesn't reflect the mime type, and may end up getting changed by
 * the server, on upload.
 *
 * @param {string[]} urls The list of URLs
 * @return {Record< string, string >} A URL => basename record.
 */
export function generateUniqueBasenames( urls ) {
	const basenames = new Set();

	return Object.fromEntries(
		urls.map( ( url ) => {
			// We prefer to match the remote filename, if possible.
			const filename = getFilename( url );
			let basename = '';

			if ( filename ) {
				const parts = filename.split( '.' );
				if ( parts.length > 1 ) {
					// Assume the last part is the extension.
					parts.pop();
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

			return [ url, basename ];
		} )
	);
}

/**
 * Fetch a list of URLs, turning those into promises for files with
 * unique filenames.
 *
 * @param {string[]} urls The list of URLs
 * @return {Record< string, Promise< File > >} A URL => File promise record.
 */
export function fetchMedia( urls ) {
	return Object.fromEntries(
		Object.entries( generateUniqueBasenames( urls ) ).map(
			( [ url, basename ] ) => {
				const filePromise = window
					.fetch( url.includes( '?' ) ? url : url + '?' )
					.then( ( response ) => response.blob() )
					.then( ( blob ) => {
						// The server will reject the upload if it doesn't have an extension,
						// even though it'll rewrite the file name to match the mime type.
						// Here we provide it with a safe extension to get it past that check.
						return new File( [ blob ], `${ basename }.png`, {
							type: blob.type,
						} );
					} );

				return [ url, filePromise ];
			}
		)
	);
}
