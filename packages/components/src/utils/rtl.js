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
const convertLtrToRtl = ( ltrStyles = {} ) => {
	const nextStyles = {};

	for ( const key in ltrStyles ) {
		const value = ltrStyles[ key ];
		let nextKey = key;
		if ( /left/gi.test( key ) ) {
			nextKey = [ key.replace( 'left', 'right' ) ];
		}
		if ( /Left/gi.test( key ) ) {
			nextKey = [ key.replace( 'Left', 'Right' ) ];
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
