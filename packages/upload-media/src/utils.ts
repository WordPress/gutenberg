/**
 * External dependencies
 */
import mime from 'mime/lite';

/**
 * WordPress dependencies
 */
import { getFilename } from '@wordpress/url';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { UploadError } from './upload-error';

/**
 * Converts a Blob to a File with a default name like "image.png".
 *
 * If it is already a File object, it is returned unchanged.
 *
 * @param fileOrBlob Blob object.
 * @return File object.
 */
export function convertBlobToFile( fileOrBlob: Blob | File ): File {
	if ( fileOrBlob instanceof File ) {
		return fileOrBlob;
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
 * Fetches a remote file and returns a File instance.
 *
 * @param url          URL.
 * @param nameOverride File name to use, instead of deriving it from the URL.
 */
export async function fetchFile( url: string, nameOverride?: string ) {
	const response = await fetch( url );
	if ( ! response.ok ) {
		throw new Error( `Could not fetch remote file: ${ response.status }` );
	}

	const name = nameOverride || getFileNameFromUrl( url );
	const blob = await response.blob();

	const ext = getFileExtension( name );
	const guessedMimeType = ext ? mime.getType( ext ) : '';

	let type = '';

	// blob.type can be an empty string when server does not return a correct Content-Type.
	if ( blob.type && blob.type !== 'application/octet-stream' ) {
		type = blob.type;
	} else if ( guessedMimeType ) {
		type = guessedMimeType;
	}

	const file = new File( [ blob ], name, { type } );

	if ( ! type ) {
		throw new UploadError( {
			code: 'FETCH_REMOTE_FILE_ERROR',
			message: 'File could not be downloaded',
			file,
		} );
	}

	return file;
}

/**
 * Verifies if the caller supports this mime type.
 *
 * @param file         File object.
 * @param allowedTypes List of allowed mime types.
 */
export function validateMimeType( file: File, allowedTypes?: string[] ) {
	if ( ! allowedTypes ) {
		return;
	}

	// Allowed type specified by consumer.
	const isAllowedType = allowedTypes.some( ( allowedType ) => {
		// If a complete mimetype is specified verify if it matches exactly the mime type of the file.
		if ( allowedType.includes( '/' ) ) {
			return allowedType === file.type;
		}
		// Otherwise a general mime type is used, and we should verify if the file mimetype starts with it.
		return file.type.startsWith( `${ allowedType }/` );
	} );

	if ( file.type && ! isAllowedType ) {
		throw new UploadError( {
			code: 'MIME_TYPE_NOT_SUPPORTED',
			message: sprintf(
				// translators: %s: file name.
				__( '%s: Sorry, this file type is not supported here.' ),
				file.name
			),
			file,
		} );
	}
}

/**
 * Determines whether a given file type is supported for client-side processing.
 *
 * @param type Mime type.
 * @return Whether the file type is supported.
 */
export function isImageTypeSupported(
	type: string
): type is
	| 'image/avif'
	| 'image/gif'
	| 'image/heic'
	| 'image/heif'
	| 'image/jpeg'
	| 'image/jxl'
	| 'image/png'
	| 'image/tiff'
	| 'image/webp' {
	return [
		'image/avif',
		'image/gif',
		'image/heic',
		'image/heif',
		'image/jpeg',
		'image/jxl',
		'image/png',
		'image/tiff',
		'image/webp',
	].includes( type );
}
