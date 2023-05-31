/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * The media details object.
 *
 * @typedef {Object} MediaDetails
 *
 * @property {string} mediaWidth     Width value of the media.
 * @property {string} mediaHeight    Height value of the media.
 * @property {string} mediaSourceUrl URL of the media.
 */

/**
 * Returns the featured media dimensions and source URL.
 *
 * @param {Object} media  The media object.
 * @param {number} postId The post ID of the media
 * @return {MediaDetails} The featured media details.
 */
export default function getFeaturedMediaDetails( media, postId ) {
	if ( ! media ) {
		return {};
	}

	const defaultSize = applyFilters(
		'editor.PostFeaturedImage.imageSize',
		'large',
		media.id,
		postId
	);
	if ( defaultSize in ( media?.media_details?.sizes ?? {} ) ) {
		return {
			mediaWidth: media.media_details.sizes[ defaultSize ].width,
			mediaHeight: media.media_details.sizes[ defaultSize ].height,
			mediaSourceUrl: media.media_details.sizes[ defaultSize ].source_url,
		};
	}

	// Use fallbackSize when defaultSize is not available.
	const fallbackSize = applyFilters(
		'editor.PostFeaturedImage.imageSize',
		'thumbnail',
		media.id,
		postId
	);
	if ( fallbackSize in ( media?.media_details?.sizes ?? {} ) ) {
		return {
			mediaWidth: media.media_details.sizes[ fallbackSize ].width,
			mediaHeight: media.media_details.sizes[ fallbackSize ].height,
			mediaSourceUrl:
				media.media_details.sizes[ fallbackSize ].source_url,
		};
	}

	// Use full image size when fallbackSize and defaultSize are not available.
	return {
		mediaWidth: media.media_details.width,
		mediaHeight: media.media_details.height,
		mediaSourceUrl: media.source_url,
	};
}
