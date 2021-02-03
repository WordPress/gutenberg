/**
 * External dependencies
 */
import tinycolor from 'tinycolor2';

/**
 * Tinycolor object representation for a color.
 *
 * @typedef {Object} TinyColor
 * @property {number} _r Red component of the color in the range [0,255].
 * @property {number} _g Green component of the color in the range [0,255].
 * @property {number} _b Blue component of the color in the range [0,255].
 */

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
	return getGradientFromCSSColors( getHexColorsFromValues( values ), angle );
}

/**
 * Converts a tinycolor object to a simple RGBColor.
 *
 * @param {TinyColor} color Tinycolor object.
 *
 * @return {RGBColor} RGB color with values in the range [0,1]
 */
export function tinycolorToRgb( color ) {
	// Access values directly to skip rounding that tinycolor.toRgb() does.
	return {
		r: color._r / 255,
		g: color._g / 255,
		b: color._b / 255,
	};
}

/**
 * Convert a list of colors to an object of R, G, and B values.
 *
 * @param {TinyColor[]} colors Array of RBG color objects.
 *
 * @return {RGBValues} R, G, and B values.
 */
function getValuesFromColors( colors = [] ) {
	const values = { r: [], g: [], b: [] };

	colors.forEach( ( color ) => {
		const { r, g, b } = tinycolorToRgb( color );
		values.r.push( r );
		values.g.push( g );
		values.b.push( b );
	} );

	return values;
}

/**
 * Convert a list of hex colors to an object of R, G, and B values.
 *
 * @param {string[]} colors Array of CSS hex color strings.
 *
 * @return {RGBValues} R, G, and B values.
 */
export function getValuesFromHexColors( colors = [] ) {
	return getValuesFromColors( colors.map( tinycolor ) );
}

/**
 * Convert a color values object to an array of colors.
 *
 * @param {RGBValues} values R, G, and B values.
 *
 * @return {TinyColor[]} RGB color array.
 */
export function getColorsFromValues( values = { r: [], g: [], b: [] } ) {
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
 * Convert a color values object to an array of colors.
 *
 * @param {RGBValues} values R, G, and B values.
 *
 * @return {string[]} Hex color array.
 */
export function getHexColorsFromValues( values = { r: [], g: [], b: [] } ) {
	return getColorsFromValues( values ).map( ( c ) =>
		tinycolor( c ).toHexString()
	);
}

export function getColorStopsFromValues( values = { r: [], g: [], b: [] } ) {
	const colors = getColorsFromValues( values );
	return colors.map( ( c, i ) => ( {
		position: ( i * 100 ) / ( colors.length - 1 ),
		color: c,
	} ) );
}

export function getValuesFromColorStops( colors = [] ) {
	return getValuesFromColors( colors.map( ( { color } ) => color ) );
}

export function getCustomDuotoneIdFromColorStops( colors = [] ) {
	return getCustomDuotoneIdFromHexColors(
		colors.map( ( { color } ) => tinycolor( color ).toHexString() )
	);
}

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

export function getCustomDuotoneIdFromHexColors( colors ) {
	return `duotone-filter-custom-${ colors
		.map( ( hex ) => hex.slice( 1 ).toLowerCase() )
		.join( '-' ) }`;
}
