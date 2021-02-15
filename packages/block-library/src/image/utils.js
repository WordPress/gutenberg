/**
 * External dependencies
 */
import { isEmpty, each, get } from 'lodash';

/**
 * Internal dependencies
 */
import {
	NEW_TAB_REL,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_NONE,
} from './constants';

export function removeNewTabRel( currentRel ) {
	let newRel = currentRel;

	if ( currentRel !== undefined && ! isEmpty( newRel ) ) {
		if ( ! isEmpty( newRel ) ) {
			each( NEW_TAB_REL, ( relVal ) => {
				const regExp = new RegExp( '\\b' + relVal + '\\b', 'gi' );
				newRel = newRel.replace( regExp, '' );
			} );

			// Only trim if NEW_TAB_REL values was replaced.
			if ( newRel !== currentRel ) {
				newRel = newRel.trim();
			}

			if ( isEmpty( newRel ) ) {
				newRel = undefined;
			}
		}
	}

	return newRel;
}

/**
 * Helper to get the link target settings to be stored.
 *
 * @param {boolean} value         The new link target value.
 * @param {Object} attributes     Block attributes.
 * @param {Object} attributes.rel Image block's rel attribute.
 *
 * @return {Object} Updated link target settings.
 */
export function getUpdatedLinkTargetSettings( value, { rel } ) {
	const linkTarget = value ? '_blank' : undefined;

	let updatedRel;
	if ( ! linkTarget && ! rel ) {
		updatedRel = undefined;
	} else {
		updatedRel = removeNewTabRel( rel );
	}

	return {
		linkTarget,
		rel: updatedRel,
	};
}

/**
 * Determines new href and linkDestination values for an image block from the
 * supplied link destination.
 *
 * @param {Object} image       Image.
 * @param {string} destination Link destination.
 * @return {string}            New url attributes to assign to image block.
 */
export function getUrl( image, destination ) {
	switch ( destination ) {
		case LINK_DESTINATION_MEDIA:
			return image?.source_url || image?.url; // eslint-disable-line camelcase
		case LINK_DESTINATION_ATTACHMENT:
			return image?.link;
		case LINK_DESTINATION_NONE:
			return undefined;
	}

	return {};
}

/**
 * Determines new Image block attributes size selection.
 *
 * @param {Object} image Media file object for gallery image.
 * @param {string} size  Selected size slug to apply.
 */
export function getImageSizeAttributes( image, size ) {
	const url = get( image, [ 'media_details', 'sizes', size, 'source_url' ] );

	if ( url ) {
		return { url, width: undefined, height: undefined, sizeSlug: size };
	}

	return {};
}
