/**
 * External dependencies
 */
import tinycolor from 'tinycolor2';

/**
 * Object representation for a color.
 *
 * @typedef {Object} RGBColor
 * @property {number} r Red component of the color in the range [0,1].
 * @property {number} g Green component of the color in the range [0,1].
 * @property {number} b Blue component of the color in the range [0,1].
 */

/**
 * Arrays of values in convenient format for SVG feComponentTransfer.
 *
 * @typedef {Object} RGBValues
 * @property {number[]} r Array of red components of the colors in the range [0,1].
 * @property {number[]} g Array of green components of the colors in the range [0,1].
 * @property {number[]} b Array of blue components of the colors in the range [0,1].
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
			brightness: tinycolor( color ).getBrightness() / 255,
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
 * Create a CSS gradient for duotone swatches.
 *
 * @param {RGBValues} values R, G, and B values.
 * @param {string}   angle  CSS gradient angle.
 *
 * @return {string} CSS gradient string for the duotone swatch.
 */
export function getGradientFromValues(
	values = { r: [], g: [], b: [] },
	angle
) {
	return getGradientFromCSSColors(
		getColorsFromValues( values ).map( ( tcolor ) => tcolor.toRgbString() ),
		angle
	);
}

/**
 * Convert a list of colors to an object of R, G, and B values.
 *
 * @param {string[]} colors Array of RBG color strings.
 *
 * @return {RGBValues} R, G, and B values.
 */
export function getValuesFromColors( colors = [] ) {
	const values = { r: [], g: [], b: [] };

	colors.forEach( ( color ) => {
		// Access values directly to skip rounding that tinycolor.toRgb() does.
		const tcolor = tinycolor( color );
		values.r.push( tcolor._r / 255 );
		values.g.push( tcolor._g / 255 );
		values.b.push( tcolor._b / 255 );
	} );

	return values;
}

/**
 * Convert a color values object to an array of colors.
 *
 * @param {RGBValues} values R, G, and B values.
 *
 * @return {Object[]} Tinycolor object array.
 */
function getColorsFromValues( values = { r: [], g: [], b: [] } ) {
	// R, G, and B should all be the same length, so we only need to map over one.
	return values.r.map( ( x, i ) => {
		return tinycolor( {
			r: values.r[ i ] * 255,
			g: values.g[ i ] * 255,
			b: values.b[ i ] * 255,
		} );
	} );
}

/**
 * Convert a color values object to an array of color stops.
 *
 * @param {RGBValues} values R, G, and B values.
 *
 * @return {Object[]} Color stop information.
 */
export function getColorStopsFromValues( values = { r: [], g: [], b: [] } ) {
	const colors = getColorsFromValues( values );
	return colors.map( ( tcolor, i ) => ( {
		position: ( i * 100 ) / ( colors.length - 1 ),
		color: tcolor.toRgbString(),
	} ) );
}

/**
 * Convert a color values object to an array of color stops.
 *
 * @param {Object[]} colorStops Color stop information.
 *
 * @return {RGBValues} R, G, and B values.
 */
export function getValuesFromColorStops( colorStops = [] ) {
	return getValuesFromColors( colorStops.map( ( { color } ) => color ) );
}

/**
 * Convert a color values object to an array of colors.
 *
 * @param {RGBValues} values R, G, and B values.
 *
 * @return {string[]} Hex color array.
 */
export function getHexColorsFromValues( values = { r: [], g: [], b: [] } ) {
	return getColorsFromValues( values ).map( ( tcolor ) =>
		tcolor.toHexString()
	);
}
