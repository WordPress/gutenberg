/**
 * External dependencies
 */
import { css } from '@emotion/core';

const lowerLeftRegExp = new RegExp( /-left/g );
const lowerRightRegExp = new RegExp( /-right/g );
const upperLeftRegExp = new RegExp( /Left/g );
const upperRightRegExp = new RegExp( /Right/g );

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

		// Direct flip
		if ( key === 'left' ) {
			nextKey = 'right';
		}
		if ( key === 'right' ) {
			nextKey = 'left';
		}
		// Lowercase flip
		if ( lowerLeftRegExp.test( key ) ) {
			nextKey = key.replace( lowerLeftRegExp, '-right' );
		}
		if ( lowerRightRegExp.test( key ) ) {
			nextKey = key.replace( lowerRightRegExp, '-left' );
		}
		// Capitalized case flip
		if ( upperLeftRegExp.test( key ) ) {
			nextKey = key.replace( upperLeftRegExp, 'Right' );
		}
		if ( upperRightRegExp.test( key ) ) {
			nextKey = key.replace( upperRightRegExp, 'Left' );
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
