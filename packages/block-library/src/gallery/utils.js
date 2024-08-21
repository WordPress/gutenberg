/**
 * Internal dependencies
 */
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE,
	LINK_DESTINATION_MEDIA_WP_CORE,
	LINK_DESTINATION_ATTACHMENT_WP_CORE,
	LINK_DESTINATION_LIGHTBOX,
} from './constants';
import {
	LINK_DESTINATION_ATTACHMENT as IMAGE_LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA as IMAGE_LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE as IMAGE_LINK_DESTINATION_NONE,
} from '../image/constants';

/**
 * Determines new href and linkDestination values for an Image block from the
 * supplied Gallery link destination, or falls back to the Image blocks link.
 *
 * @param {Object} image              Gallery image.
 * @param {string} galleryDestination Gallery's selected link destination.
 * @param {Object} imageDestination   Image block link destination attribute.
 * @param {Object} attributes         Block attributes.
 * @param {Object} lightboxSetting    Lightbox setting.
 *
 * @return {Object}            New attributes to assign to image block.
 */
export function getHrefAndDestination(
	image,
	galleryDestination,
	imageDestination,
	attributes,
	lightboxSetting
) {
	// Gutenberg and WordPress use different constants so if image_default_link_type
	// option is set we need to map from the WP Core values.
	switch ( imageDestination ? imageDestination : galleryDestination ) {
		case LINK_DESTINATION_MEDIA_WP_CORE:
		case LINK_DESTINATION_MEDIA:
			return {
				href: image?.source_url || image?.url, // eslint-disable-line camelcase
				linkDestination: IMAGE_LINK_DESTINATION_MEDIA,
				lightbox: lightboxSetting?.enabled
					? { ...attributes?.lightbox, enabled: false }
					: undefined,
			};
		case LINK_DESTINATION_ATTACHMENT_WP_CORE:
		case LINK_DESTINATION_ATTACHMENT:
			return {
				href: image?.link,
				linkDestination: IMAGE_LINK_DESTINATION_ATTACHMENT,
				lightbox: lightboxSetting?.enabled
					? { ...attributes?.lightbox, enabled: false }
					: undefined,
			};
		case LINK_DESTINATION_LIGHTBOX:
			return {
				href: undefined,
				lightbox: ! lightboxSetting?.enabled
					? { ...attributes?.lightbox, enabled: true }
					: undefined,
				linkDestination: IMAGE_LINK_DESTINATION_NONE,
			};
		case LINK_DESTINATION_NONE:
			return {
				href: undefined,
				linkDestination: IMAGE_LINK_DESTINATION_NONE,
				lightbox: undefined,
			};
	}

	return {};
}
