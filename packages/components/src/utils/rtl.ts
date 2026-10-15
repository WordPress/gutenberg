import { css, type CSSObject } from '@emotion/react';
import type { CSSProperties } from 'react';
import { isRTL } from '@wordpress/i18n';

const LOWER_LEFT_REGEXP = new RegExp( /-left/g );
const LOWER_RIGHT_REGEXP = new RegExp( /-right/g );
const UPPER_LEFT_REGEXP = new RegExp( /Left/g );
const UPPER_RIGHT_REGEXP = new RegExp( /Right/g );

/**
 * Flips a CSS property from left <-> right.
 *
 * @param key The CSS property name.
 *
 * @return The flipped CSS property name, if applicable.
 */
function getConvertedKey( key: string ) {
	if ( key === 'left' ) {
		return 'right';
	}

	if ( key === 'right' ) {
		return 'left';
	}

	if ( LOWER_LEFT_REGEXP.test( key ) ) {
		return key.replace( LOWER_LEFT_REGEXP, '-right' );
	}

	if ( LOWER_RIGHT_REGEXP.test( key ) ) {
		return key.replace( LOWER_RIGHT_REGEXP, '-left' );
	}

	if ( UPPER_LEFT_REGEXP.test( key ) ) {
		return key.replace( UPPER_LEFT_REGEXP, 'Right' );
	}

	if ( UPPER_RIGHT_REGEXP.test( key ) ) {
		return key.replace( UPPER_RIGHT_REGEXP, 'Left' );
	}

	return key;
}

/**
 * An incredibly basic ltr -> rtl converter for style properties
 *
 * @param ltrStyles
 *
 * @return Converted ltr -> rtl styles
 */
export const convertLTRToRTL = (
	ltrStyles: CSSProperties = {}
): CSSProperties => {
	return Object.fromEntries(
		Object.entries( ltrStyles ).map( ( [ key, value ] ) => [
			getConvertedKey( key ),
			value,
		] )
	);
};

/**
 * A higher-order function that create an incredibly basic ltr -> rtl style converter for CSS objects.
 *
 * @param ltrStyles   Ltr styles. Converts and renders from ltr -> rtl styles, if applicable.
 * @param [rtlStyles] Rtl styles. Renders if provided.
 *
 * @return A function to output CSS styles for Emotion's renderer
 */
export function rtl(
	ltrStyles: CSSProperties = {},
	rtlStyles?: CSSProperties
) {
	return () => {
		if ( rtlStyles ) {
			return isRTL()
				? css( rtlStyles as CSSObject )
				: css( ltrStyles as CSSObject );
		}

		return isRTL()
			? css( convertLTRToRTL( ltrStyles ) as CSSObject )
			: css( ltrStyles as CSSObject );
	};
}

/**
 * Call this in the `useMemo` dependency array to ensure that subsequent renders will
 * cause rtl styles to update based on the `isRTL` return value even if all other dependencies
 * remain the same.
 *
 * @example
 * const styles = useMemo( () => {
 *   return css`
 *     ${ rtl( { marginRight: '10px' } ) }
 *   `;
 * }, [ rtl.watch() ] );
 */
rtl.watch = () => isRTL();
