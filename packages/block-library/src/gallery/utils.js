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
import { getUpdatedLinkTargetSettings as getLinkTargetSettings } from '../image/utils';

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
				href: image?.source_url, // eslint-disable-line camelcase
				linkDestination: 'media',
			};
		case LINK_DESTINATION_ATTACHMENT:
			return {
				href: image?.link,
				linkDestination: 'attachment',
			};
		case LINK_DESTINATION_NONE:
			return {
				href: undefined,
				linkDestination: LINK_DESTINATION_NONE,
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

/**
 * Determine new attribute values for an Image block based on Gallery settings
 * and user's choice to apply for all gallery images or only as a fallback if
 * the image block doesn't have a value set.
 *
 * @param {Object} parentOptions Gallery attributes for linkTo, linkTarget & sizeSlug.
 * @param {Object} attributes    Image block attributes.
 * @param {Object} image         Media object for block's image.
 * @param {boolean} forceUpdate  Whether to force the Image block updates or only as a fallback.
 */
export function getNewImageAttributes(
	parentOptions,
	attributes,
	image,
	forceUpdate
) {
	if ( forceUpdate ) {
		return {
			...getHrefAndDestination( image, parentOptions.linkTo ),
			...getLinkTargetSettings( parentOptions.linkTarget, attributes ),
			sizeSlug,
		};
	}

	// Not forcing update so we need to determine which attributes to set.
	const { linkDestination, linkTarget, sizeSlug } = attributes;
	let newAttributes = {};

	// Set linkDestination if image's is not set or is 'none'.
	if ( ! linkDestination || linkDestination === 'none' ) {
		newAttributes = {
			...newAttributes,
			...getHrefAndDestination( image, parentOptions.linkTo ),
		};
	}

	// Set linkTarget if parent sets it and image does not.
	if ( parentOptions.linkTarget && linkTarget !== '_blank' ) {
		newAttributes = {
			...newAttributes,
			...getLinkTargetSettings( parentOptions.linkTarget, attributes ),
		};
	}

	// Set image size slug if it isn't set.
	if ( ! sizeSlug ) {
		newAttributes = {
			...newAttributes,
			...getImageSizeAttributes( image, parentOptions.sizeSlug ),
		};
	}

	return newAttributes;
}
