/**
 * Shape produced either by the REST API (`media_type` + `mime_type`) or by
 * the media library picker (`type` + `mime`). The helper handles both.
 */
type MediaLike = {
	media_type?: string;
	mime_type?: string;
	type?: string;
	mime?: string;
};

/**
 * Derives a simple media type ('image' | 'video' | 'audio') from an attachment.
 *
 * The REST API returns `media_type: 'image'` for images and `media_type: 'file'`
 * for both video and audio, so the helper also inspects `mime_type` to tell
 * those apart. The media library picker uses `type` and `mime` instead — both
 * shapes are accepted.
 *
 * @param media Attachment object from REST or the media library.
 * @return Resolved media type, or null for nullish input.
 */
export function getMediaType(
	media: MediaLike | null | undefined
): 'image' | 'video' | 'audio' | null {
	if ( ! media ) {
		return null;
	}
	if ( media.media_type === 'image' || media.type === 'image' ) {
		return 'image';
	}
	const mime = media.mime_type || media.mime || '';
	if ( mime.startsWith( 'audio/' ) ) {
		return 'audio';
	}
	if ( mime.startsWith( 'video/' ) || media.media_type === 'file' ) {
		return 'video';
	}
	if ( media.type === 'audio' ) {
		return 'audio';
	}
	if ( media.type === 'video' ) {
		return 'video';
	}
	return 'image';
}
