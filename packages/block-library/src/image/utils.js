/**
 * Internal dependencies
 */
import { NEW_TAB_REL, ALLOWED_MEDIA_TYPES } from './constants';

/**
 * Evaluates a CSS aspect-ratio property value as a number.
 *
 * Degenerate or invalid ratios behave as 'auto'. And 'auto' ratios return NaN.
 *
 * @see https://drafts.csswg.org/css-sizing-4/#aspect-ratio
 *
 * @param {string} value CSS aspect-ratio property value.
 * @return {number} Numerical aspect ratio or NaN if invalid.
 */
export function evalAspectRatio( value ) {
	const [ width, height = 1 ] = value.split( '/' ).map( Number );
	const aspectRatio = width / height;
	return aspectRatio === Infinity || aspectRatio === 0 ? NaN : aspectRatio;
}

export function removeNewTabRel( currentRel ) {
	let newRel = currentRel;

	if ( currentRel !== undefined && newRel ) {
		NEW_TAB_REL.forEach( ( relVal ) => {
			const regExp = new RegExp( '\\b' + relVal + '\\b', 'gi' );
			newRel = newRel.replace( regExp, '' );
		} );

		// Only trim if NEW_TAB_REL values was replaced.
		if ( newRel !== currentRel ) {
			newRel = newRel.trim();
		}

		if ( ! newRel ) {
			newRel = undefined;
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
	const url = image?.media_details?.sizes?.[ size ]?.source_url;

	if ( url ) {
		return { url, width: undefined, height: undefined, sizeSlug: size };
	}

	return {};
}

/**
 * Checks if the file has a valid file type.
 *
 * @param {File} file - The file to check.
 * @return {boolean} - Returns true if the file has a valid file type, otherwise false.
 */
export function isValidFileType( file ) {
	return ALLOWED_MEDIA_TYPES.some(
		( mediaType ) => file.type.indexOf( mediaType ) === 0
	);
}
