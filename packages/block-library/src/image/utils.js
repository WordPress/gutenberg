/**
 * External dependencies
 */
import { isEmpty, get } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { NEW_TAB_REL } from './constants';

export function removeNewTabRel( currentRel ) {
	let newRel = currentRel;

	if ( currentRel !== undefined && ! isEmpty( newRel ) ) {
		if ( ! isEmpty( newRel ) ) {
			NEW_TAB_REL.forEach( ( relVal ) => {
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
 * @param {boolean} value          The new link target value.
 * @param {Object}  attributes     Block attributes.
 * @param {Object}  attributes.rel Image block's rel attribute.
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

/**
 * Performs a GET request on an image file to confirm whether it has been deleted from the database.
 *
 * @param {number=} mediaId The id of the image.
 * @return {Promise} Media Object Promise.
 */
export async function isMediaFileDeleted( mediaId ) {
	try {
		const response = await apiFetch( {
			path: `/wp/v2/media/${ mediaId }`,
		} );
		const isMediaFileAvailable = response && response?.id === mediaId;
		return ! isMediaFileAvailable;
	} catch ( err ) {
		return true;
	}
}
