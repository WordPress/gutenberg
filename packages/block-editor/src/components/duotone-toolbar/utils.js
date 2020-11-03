/**
 * Object representation for a color
 *
 * @typedef {Object} RGBColor
 * @property {number} r Red component of the color in the range [0,1].
 * @property {number} g Green component of the color in the range [0,1].
 * @property {number} b Blue component of the color in the range [0,1].
 */

/**
 * @typedef {Object} RGBValues
 * @property {number[]} r Array of red components of the colors in the range [0,1].
 * @property {number[]} g Array of green components of the colors in the range [0,1].
 * @property {number[]} b Array of blue components of the colors in the range [0,1].
 */

/**
 * Convert a CSS hex string to an RGB object, discarding any alpha component.
 *
 * @param {string} color CSS hex string.
 *
 * @return {RGBColor} RGB values.
 */
export function hex2rgb( color = '' ) {
	let r = '0x00';
	let g = '0x00';
	let b = '0x00';

	switch ( color.length ) {
		// Parse #RRGGBBAA and #RRGGBB strings.
		case 9:
		case 7:
			r = '0x' + color[ 1 ] + color[ 2 ];
			g = '0x' + color[ 3 ] + color[ 4 ];
			b = '0x' + color[ 5 ] + color[ 6 ];
			break;
		// Parse #RGBA and #RGB strings.
		case 5:
		case 4:
			r = '0x' + color[ 1 ] + color[ 1 ];
			g = '0x' + color[ 2 ] + color[ 2 ];
			b = '0x' + color[ 3 ] + color[ 3 ];
			break;
	}

	return {
		r: r / 0xff,
		g: g / 0xff,
		b: b / 0xff,
	};
}

/**
 * Convert an RGB object to a CSS hex string.
 *
 * @param {RGBColor} color RGB values.
 *
 * @return {string} CSS hex string.
 */
export function rgb2hex( color = {} ) {
	const r = color.r * 0xff;
	const g = color.g * 0xff;
	const b = color.b * 0xff;

	// Disable reason: Joining the RGB components into a single number.
	// eslint-disable-next-line no-bitwise
	const num = ( r << 16 ) | ( g << 8 ) | b;

	return `#${ num.toString( 16 ).padStart( 6, '0' ) }`;
}

/**
 * Generate a duotone gradient from a list of colors.
 *
 * @param {string[]} colors CSS color strings.
 *
 * @return {string} CSS gradient string for the duotone swatch.
 */
export function getGradientFromCSSColors( colors = [] ) {
	const l = 100 / colors.length;

	const stops = colors
		.map( ( c, i ) => `${ c } ${ i * l }%, ${ c } ${ ( i + 1 ) * l }%` )
		.join( ', ' );

	return `linear-gradient( 135deg, ${ stops } )`;
}

/**
 * Create a CSS gradient for duotone swatches.
 *
 * @param {RGBValues} values R, G, and B values.
 *
 * @return {string} CSS gradient string for the duotone swatch.
 */
export function getGradientFromValues( values = { r: [], g: [], b: [] } ) {
	return getGradientFromCSSColors( getHexColorsFromValues( values ) );
}

/**
 * Convert a list of colors to an object of R, G, and B values.
 *
 * @param {RGBColor[]} colors Array of RBG color objects.
 *
 * @return {RGBValues} R, G, and B values.
 */
export function getValuesFromColors( colors = [] ) {
	const values = { r: [], g: [], b: [] };

	colors.forEach( ( { r, g, b } ) => {
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
	return getValuesFromColors( colors.map( hex2rgb ) );
}

/**
 * Convert a color values object to an array of colors.
 *
 * @param {RGBValues} values R, G, and B values.
 *
 * @return {RGBColor[]} RGB color array.
 */
export function getColorsFromValues( values = { r: [], g: [], b: [] } ) {
	// R, G, and B should all be the same length, so we only need to map over one.
	return values.r.map( ( x, i ) => {
		return {
			r: values.r[ i ],
			g: values.g[ i ],
			b: values.b[ i ],
		};
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
	return getColorsFromValues( values ).map( rgb2hex );
}

/**
 * Convert a hex color to perceived brightness.
 *
 * @param {string} color Hex color
 * @return {number} Perceived brightness of the color
 */
export function toBrightness( color ) {
	const { r, g, b } = hex2rgb( color );
	return r * 0.299 + g * 0.587 + b * 0.114;
}
