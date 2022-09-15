/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

extend( [ namesPlugin ] );

/**
 * Object representation for a color.
 *
 * @typedef {Object} RGBColor
 * @property {number} r Red component of the color in the range [0,1].
 * @property {number} g Green component of the color in the range [0,1].
 * @property {number} b Blue component of the color in the range [0,1].
 */

/**
 * Calculate the brightest and darkest values from a color palette.
 *
 * @param {Object[]} palette Color palette for the theme.
 *
 * @return {string[]} Tuple of the darkest color and brightest color.
 */
export function getDefaultColors( palette ) {
	// A default dark and light color are required.
	if ( ! palette || palette.length < 2 ) return [ '#000', '#fff' ];

	return palette
		.map( ( { color } ) => ( {
			color,
			brightness: colord( color ).brightness(),
		} ) )
		.reduce(
			( [ min, max ], current ) => {
				return [
					current.brightness <= min.brightness ? current : min,
					current.brightness >= max.brightness ? current : max,
				];
			},
			[ { brightness: 1 }, { brightness: 0 } ]
		)
		.map( ( { color } ) => color );
}

/**
 * Generate a duotone gradient from a list of colors.
 *
 * @param {string[]} colors CSS color strings.
 * @param {string}   angle  CSS gradient angle.
 *
 * @return {string} CSS gradient string for the duotone swatch.
 */
export function getGradientFromCSSColors( colors = [], angle = '90deg' ) {
	const l = 100 / colors.length;

	const stops = colors
		.map( ( c, i ) => `${ c } ${ i * l }%, ${ c } ${ ( i + 1 ) * l }%` )
		.join( ', ' );

	return `linear-gradient( ${ angle }, ${ stops } )`;
}

/**
 * Convert a color array to an array of color stops.
 *
 * @param {string[]} colors CSS colors array
 *
 * @return {Object[]} Color stop information.
 */
export function getColorStopsFromColors( colors ) {
	return colors.map( ( color, i ) => ( {
		position: ( i * 100 ) / ( colors.length - 1 ),
		color,
	} ) );
}

/**
 * Convert a color stop array to an array colors.
 *
 * @param {Object[]} colorStops Color stop information.
 *
 * @return {string[]} CSS colors array.
 */
export function getColorsFromColorStops( colorStops = [] ) {
	return colorStops.map( ( { color } ) => color );
}
