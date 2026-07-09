/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Transform media library image data into album cover attributes.
 *
 * @param {Object} image - Image object from the media library.
 * @return {Object} Album cover attributes for the playlist-track block.
 */
export function getAlbumCoverAttributes( image ) {
	const imageSrc = image?.src ?? image?.url;

	// Prevent using the default media attachment icon as the track image.
	if ( imageSrc?.endsWith( '/images/media/audio.svg' ) ) {
		return {
			image: '',
			imageAlt: '',
		};
	}

	return {
		// Note: Image is not available when a new track is uploaded.
		image: imageSrc,
		imageAlt: imageSrc ? image?.alt || image?.alt_text || '' : undefined,
	};
}

/**
 * Transform media library data into track block attributes.
 *
 * @param {Object} media - Media object from the media library.
 * @return {Object} Track attributes for the playlist-track block.
 */
export function getTrackAttributes( media ) {
	return {
		id: media.id || media.url, // Attachment ID or URL.
		src: media.url,
		title: media.title,
		artist:
			media.artist ||
			media?.meta?.artist ||
			media?.media_details?.artist ||
			__( 'Unknown artist' ),
		album:
			media.album ||
			media?.meta?.album ||
			media?.media_details?.album ||
			__( 'Unknown album' ),
		length: media?.fileLength || media?.media_details?.length_formatted,
		...getAlbumCoverAttributes( media?.image ),
	};
}
