/**
 * Media type result.
 */
export interface MediaType {
	type: 'image' | 'video' | 'audio' | 'application';
}

/**
 * Determines the media type from a MIME type string.
 *
 * @param mimeType - The MIME type to check.
 * @return Object with type property ('image', 'video', 'audio', or 'application').
 */
export function getMediaTypeFromMimeType( mimeType?: string ): MediaType {
	if ( ! mimeType ) {
		return { type: 'application' };
	}

	if ( mimeType.startsWith( 'image/' ) ) {
		return { type: 'image' };
	}
	if ( mimeType.startsWith( 'video/' ) ) {
		return { type: 'video' };
	}
	if ( mimeType.startsWith( 'audio/' ) ) {
		return { type: 'audio' };
	}
	return { type: 'application' };
}
