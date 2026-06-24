/**
 * WordPress dependencies
 */
import { getFilename } from '@wordpress/url';
import { _x } from '@wordpress/i18n';

/**
 * Converts a Blob to a File with a default name like "image.png".
 *
 * If it is already a File object, it is returned unchanged.
 *
 * Handles cross-realm File objects (e.g., from iframes) that have a `name`
 * property but fail `instanceof File` checks because the File constructor
 * differs between browsing contexts.
 *
 * @param fileOrBlob Blob object.
 * @return File object.
 */
export function convertBlobToFile( fileOrBlob: Blob | File ): File {
	if ( fileOrBlob instanceof File ) {
		return fileOrBlob;
	}

	// Handle cross-realm File objects (e.g., from iframes where the block
	// editor canvas renders). These objects have a `name` property but fail
	// the `instanceof File` check because each browsing context has its own
	// File constructor.
	if (
		'name' in fileOrBlob &&
		typeof ( fileOrBlob as File ).name === 'string'
	) {
		return new File( [ fileOrBlob ], ( fileOrBlob as File ).name, {
			type: fileOrBlob.type,
			lastModified: ( fileOrBlob as File ).lastModified,
		} );
	}

	// Extension is only an approximation.
	// The server will override it if incorrect.
	const ext = fileOrBlob.type.split( '/' )[ 1 ];
	const mediaType =
		'application/pdf' === fileOrBlob.type
			? 'document'
			: fileOrBlob.type.split( '/' )[ 0 ];
	return new File( [ fileOrBlob ], `${ mediaType }.${ ext }`, {
		type: fileOrBlob.type,
	} );
}

/**
 * Renames a given file and returns a new file.
 *
 * Copies over the last modified time.
 *
 * @param file File object.
 * @param name File name.
 * @return Renamed file object.
 */
export function renameFile( file: File, name: string ): File {
	return new File( [ file ], name, {
		type: file.type,
		lastModified: file.lastModified,
	} );
}

/**
 * Clones a given file object.
 *
 * @param file File object.
 * @return New file object.
 */
export function cloneFile( file: File ): File {
	return renameFile( file, file.name );
}

/**
 * Returns the file extension from a given file name or URL.
 *
 * @param file File URL.
 * @return File extension or null if it does not have one.
 */
export function getFileExtension( file: string ): string | null {
	return file.includes( '.' ) ? file.split( '.' ).pop() || null : null;
}

/**
 * Returns file basename without extension.
 *
 * For example, turns "my-awesome-file.jpeg" into "my-awesome-file".
 *
 * @param name File name.
 * @return File basename.
 */
export function getFileBasename( name: string ): string {
	return name.includes( '.' )
		? name.split( '.' ).slice( 0, -1 ).join( '.' )
		: name;
}

/**
 * Returns the file name including extension from a URL.
 *
 * @param url File URL.
 * @return File name.
 */
export function getFileNameFromUrl( url: string ) {
	return getFilename( url ) || _x( 'unnamed', 'file name' );
}

/**
 * Maps a file extension to its corresponding image mime type.
 *
 * Used to recover a usable mime type when a server response omits one or
 * returns a generic `application/octet-stream` for a known image extension.
 */
const EXTENSION_TO_MIME_TYPE: Record< string, string > = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	avif: 'image/avif',
};

/**
 * Fetches a file from a URL and returns it as a File object.
 *
 * Used to download an existing attachment's original file so it can be
 * re-processed client-side. When the server response does not include a
 * usable `Content-Type` (or returns a generic one), the mime type is
 * inferred from the file extension.
 *
 * @param url        URL of the file to fetch.
 * @param [fileName] Optional file name to use. Defaults to the name derived from the URL.
 * @return File object.
 */
export async function fetchFile(
	url: string,
	fileName?: string
): Promise< File > {
	const name = fileName || getFileNameFromUrl( url );

	const response = await fetch( url );
	if ( ! response.ok ) {
		throw new Error(
			`Could not fetch file from ${ url } (${ response.status })`
		);
	}

	const blob = await response.blob();

	let { type } = blob;
	if ( ! type || type === 'application/octet-stream' ) {
		const ext = getFileExtension( name )?.toLowerCase();
		if ( ext && EXTENSION_TO_MIME_TYPE[ ext ] ) {
			type = EXTENSION_TO_MIME_TYPE[ ext ];
		}
	}

	return new File( [ blob ], name, { type } );
}
