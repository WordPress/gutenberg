/**
 * External dependencies
 */
import { css } from '@emotion/core';

function getRtl() {
	return !! ( document && document.documentElement.dir === 'rtl' );
}

/**
 * Simple hook to retrieve RTL direction value
 */
export function useRtl() {
	return getRtl();
}

/**
 * An incredibly basic ltr -> rtl converter for style properties
 *
 * @param {Object} ltrStyles
 * @return {Object} Converted ltr -> rtl styles
 */
export const convertLtrToRtl = ( ltrStyles = {} ) => {
	const nextStyles = {};

	for ( const key in ltrStyles ) {
		const value = ltrStyles[ key ];
		let nextKey = key;

		// Lowercase flip
		if ( /left/g.test( key ) ) {
			nextKey = key.replace( /left/g, 'right' );
		}
		if ( /right/g.test( key ) ) {
			nextKey = key.replace( /right/g, 'left' );
		}
		// Capitalized case flip
		if ( /Left/g.test( key ) ) {
			nextKey = key.replace( /Left/g, 'Right' );
		}
		if ( /Right/g.test( key ) ) {
			nextKey = key.replace( /Right/g, 'Left' );
		}

		nextStyles[ nextKey ] = value;
	}

	return nextStyles;
};

/**
 * An incredibly basic ltr -> rtl style converter for CSS objects.
 *
 * @param {Object} ltrStyles Ltr styles. Converts and renders from ltr -> rtl styles, if applicable.
 * @param {null|Object} rtlStyles Rtl styles. Renders if provided.
 * @return {Object} Rendered CSS styles for Emotion's renderer
 */
export function rtl( ltrStyles = {}, rtlStyles ) {
	return () => {
		const isRtl = getRtl();

		if ( rtlStyles ) {
			return isRtl ? css( rtlStyles ) : css( ltrStyles );
		}

		return isRtl ? css( convertLtrToRtl( ltrStyles ) ) : css( ltrStyles );
	};
}
