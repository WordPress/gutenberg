/**
 * WordPress dependencies
 */
import { getFilename } from '@wordpress/url';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { detectClientSideMediaSupport } from './feature-detection';

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
 * Flag to track if we've already logged the fallback message.
 */
let hasLoggedFallback = false;

/**
 * Cached result of whether client-side media processing should be enabled.
 * This is computed once per session for efficiency and stability.
 */
let isClientSideMediaEnabledCache: boolean | null = null;

/**
 * Checks if client-side media processing should be enabled.
 *
 * Returns true only if:
 * 1. The client-side media processing flag is enabled
 * 2. The browser supports WebAssembly, SharedArrayBuffer, cross-origin isolation, and CSP allows blob workers
 *
 * The result is cached for the session to ensure stability during React renders.
 *
 * @return Whether client-side media processing should be enabled.
 */
export function shouldEnableClientSideMediaProcessing(): boolean {
	// Return cached result if available.
	if ( isClientSideMediaEnabledCache !== null ) {
		return isClientSideMediaEnabledCache;
	}

	// Check if the client-side media processing flag is enabled first.
	if (
		typeof window !== 'undefined' &&
		! ( window as any ).__clientSideMediaProcessing
	) {
		isClientSideMediaEnabledCache = false;
		return false;
	}

	const detection = detectClientSideMediaSupport();

	if ( ! detection || ! detection.supported ) {
		// Only log once per session to avoid console spam.
		if ( ! hasLoggedFallback ) {
			// eslint-disable-next-line no-console
			console.info(
				`Client-side media processing unavailable: ${ detection.reason }. Using server-side processing.`
			);
			hasLoggedFallback = true;
		}
		isClientSideMediaEnabledCache = false;
		return false;
	}

	isClientSideMediaEnabledCache = true;
	return true;
}
