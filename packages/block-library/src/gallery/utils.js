/**
 * Internal dependencies
 */
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE,
	LINK_DESTINATION_MEDIA_WP_CORE,
	LINK_DESTINATION_ATTACHMENT_WP_CORE,
} from './constants';
import {
	LINK_DESTINATION_ATTACHMENT as IMAGE_LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA as IMAGE_LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE as IMAGE_LINK_DESTINATION_NONE,
} from '../image/constants';

/**
 * Determines new href and linkDestination values for an image block from the
 * supplied Gallery link destination.
 *
 * @param {Object} image       Gallery image.
 * @param {string} destination Gallery's selected link destination.
 * @return {Object}            New attributes to assign to image block.
 */
export function getHrefAndDestination( image, destination ) {
	// Gutenberg and WordPress use different constants so if image_default_link_type
	// option is set we need to map from the WP Core values.

	switch ( destination ) {
		case LINK_DESTINATION_MEDIA_WP_CORE:
		case LINK_DESTINATION_MEDIA:
			return {
				href: image?.source_url || image?.url, // eslint-disable-line camelcase
				linkDestination: IMAGE_LINK_DESTINATION_MEDIA,
			};
		case LINK_DESTINATION_ATTACHMENT_WP_CORE:
		case LINK_DESTINATION_ATTACHMENT:
			return {
				href: image?.link,
				linkDestination: IMAGE_LINK_DESTINATION_ATTACHMENT,
			};
		case LINK_DESTINATION_NONE:
			return {
				href: undefined,
				linkDestination: IMAGE_LINK_DESTINATION_NONE,
			};
	}

	return {};
}
