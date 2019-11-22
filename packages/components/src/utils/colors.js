/**
 * External dependencies
 */
import { get } from 'lodash';
import { parseToRgb } from 'polished';
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
	const { red, green, blue } = parseToRgb( hexValue );
	return `rgba(${ red }, ${ green }, ${ blue }, ${ alpha })`;
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
