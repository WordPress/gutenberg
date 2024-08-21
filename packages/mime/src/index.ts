/**
 * External dependencies
 */
import mime from 'mime/lite';

/**
 * Returns the media type from a given mime type.
 *
 * @param mimeType Mime type.
 * @return Media type.
 *
 * @example
 * ```js
 * import { getMediaTypeFromMimeType } from '@mexp/mime';
 *
 * getMediaTypeFromMimeType( 'image/jpeg' ) // Returns 'image'
 * getMediaTypeFromMimeType( 'video/mpeg' ) // Returns 'video'
 * getMediaTypeFromMimeType( 'audio/mpeg' ) // Returns 'audio'
 * getMediaTypeFromMimeType( 'application/pdf' ) // Returns 'pdf'
 * ```
 */
export function getMediaTypeFromMimeType( mimeType: string ): string {
	if ( mimeType === 'application/pdf' ) {
		return 'pdf';
	}
	return mimeType.split( '/' )[ 0 ];
}

/**
 * Returns the file extension for a given mime type.
 *
 * @param mimeType Mime type.
 * @return File extension or null if it could not be found.
 *
 * @example
 * ```js
 * import { getExtensionFromMimeType } from '@mexp/mime';
 *
 * getExtensionFromMimeType( 'image/jpeg' ) // Returns '.jpeg'
 * getExtensionFromMimeType( 'video/mp4' ) // Returns '.mp4'
 * getExtensionFromMimeType( 'audio/mp3' ) // Returns '.mp3'
 * getExtensionFromMimeType( 'application/pdf' ) // Returns '.pdf'
 * ```
 */
export function getExtensionFromMimeType( mimeType: string ): string | null {
	return mime.getExtension( mimeType );
}

/**
 * Get the mime type for a given file extension.
 *
 * @param ext File extension.
 * @return Mime type or null if it could not be found.
 *
 * @example
 * ```js
 * import { getMimeTypeFromExtension } from '@mexp/mime';
 *
 * getMimeTypeFromExtension( '.jpeg' ) // Returns 'image/jpeg'
 * getMimeTypeFromExtension( '.mp4' ) // Returns 'video/mp4'
 * getMimeTypeFromExtension( '.mp3' ) // Returns 'video/mp3'
 * getMimeTypeFromExtension( '.pdf' ) // Returns 'application/pdf'
 * ```
 */
export function getMimeTypeFromExtension( ext: string ): string | null {
	return mime.getType( ext );
}
