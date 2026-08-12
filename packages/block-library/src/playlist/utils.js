import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

function getMediaUrl( media ) {
	return media?.url ?? media?.source_url;
}

function getMediaTitle( media ) {
	const title = media?.title;

	if ( title === undefined ) {
		return undefined;
	}

	if ( typeof title === 'string' ) {
		return title;
	}

	return decodeEntities( title?.raw || title?.rendered || '' );
}

/**
 * Transform media library image data into track image attributes.
 *
 * @param {Object} image - Image object from the media library.
 * @return {Object} Track image attributes for the playlist-track block.
 */
export function getTrackImageAttributes( image ) {
	const imageSrc = image?.src ?? getMediaUrl( image );

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
	const mediaUrl = getMediaUrl( media );

	return {
		id: media.id || mediaUrl, // Attachment ID or URL.
		src: mediaUrl,
		title: getMediaTitle( media ),
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
		...getTrackImageAttributes( media?.image ),
	};
}
