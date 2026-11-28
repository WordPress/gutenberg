/** The media types the editor tells apart, by MIME type prefix. */
export const MEDIA_TYPES = [
	'image',
	'video',
	'audio',
	'application',
] as const;

/**
 * Media type result.
 */
export interface MediaType {
	type: ( typeof MEDIA_TYPES )[ number ];
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
