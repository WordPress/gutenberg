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
 * @param {import('tinycolor2').ColorInput} hexValue The hex value to convert to rgba().
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
 * @see https://sass-lang.com/documentation/modules/color#lighten
 * @see https://github.com/bgrins/TinyColor#lighten
 * @param {import('tinycolor2').ColorInput} value The value to lighten.
 * @param {number} by A number between 0 and 100 inclusive.
 * @return {string} The lightened color.
 */
export function lighten( value = '', by = 0 ) {
	return tinycolor( value ).lighten( by ).toString();
}

/**
 * @see https://sass-lang.com/documentation/modules/color#darken
 * @see https://github.com/bgrins/TinyColor#darken
 * @param {import('tinycolor2').ColorInput} value The value to darken.
 * @param {number} by A number between 0 and 100 inclusive.
 * @return {string} The darkened color.
 */
export function darken( value = '', by = 0 ) {
	return tinycolor( value ).darken( by ).toString();
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
