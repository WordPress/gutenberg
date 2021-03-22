/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE,
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
	// Need to determine the URL that the selected destination maps to.
	// Gutenberg and WordPress use different constants so the new link
	// destination also needs to be tweaked.
	switch ( destination ) {
		case LINK_DESTINATION_MEDIA:
			return {
				href: image?.source_url || image?.url, // eslint-disable-line camelcase
				linkDestination: IMAGE_LINK_DESTINATION_MEDIA,
			};
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

/**
 * Determines new Image block attributes affected by a change in Gallery image
 * size selection.
 *
 * @param {Object} image Media file object for gallery image.
 * @param {string} size  Gallery's selected size slug to apply.
 */
export function getImageSizeAttributes( image, size ) {
	const url = get( image, [ 'media_details', 'sizes', size, 'source_url' ] );

	if ( url ) {
		return { url, width: undefined, height: undefined, sizeSlug: size };
	}

	return {};
}
