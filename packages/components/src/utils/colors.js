/**
 * External dependencies
 */
import { get } from 'lodash';
import tinycolor from 'tinycolor2';
/**
 * Internal dependencies
 */
import { COLORS } from './colors-values';

/**
 * Generating a CSS complient rgba() color value.
 *
 * @param {string} hexValue The hex value to convert to rgba().
 * @param {number} alpha The alpha value for opacity.
 * @return {string} The converted rgba() color value.
 *
 * @example
 * rgba( '#000000', 0.5 )
 * // rgba(0, 0, 0, 0.5)
 */
export function rgba( hexValue = '', alpha = 1 ) {
	const { r, g, b } = tinycolor( hexValue ).toRgb();
	return `rgba(${ r }, ${ g }, ${ b }, ${ alpha })`;
}

/**
 * Retrieves a color from the color palette.
 *
 * @param {string} value The value to retrieve.
 * @return {string} The color (or fallback, if not found).
 *
 * @example
 * color( 'blue.wordpress.700' )
 * // #00669b
 */
export function color( value ) {
	const fallbackColor = '#000';
	return get( COLORS, value, fallbackColor );
}
