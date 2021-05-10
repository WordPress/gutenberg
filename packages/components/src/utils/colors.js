/**
 * External dependencies
 */
import tinycolor from 'tinycolor2';

/**
 * Generating a CSS compliant rgba() color value.
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
