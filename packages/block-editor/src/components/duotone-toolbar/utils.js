/**
 * Convert a CSS hex string to an RGB object, discarding any alpha component.
 *
 * @param {string} color CSS hex string.
 *
 * @return {Object} RGB values.
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
 * Convert a CSS rgb(a) string to an RGB object, ignoring any alpha component.
 *
 * @param {string} color CSS rgb(a) string.
 *
 * @return {Object} RGB values.
 */
export function cssrgb2rgb( color = '' ) {
	// Input string for reference: rgba( 127, 127, 127, 0.1 ).
	const [ r, g, b ] = color.split( '(' )[ 1 ].split( ')' )[ 0 ].split( ',' );

	// Doesn't support rgba( 127 127 127 / 10% ) format.

	return {
		r: r / 255,
		g: g / 255,
		b: b / 255,
	};
}

/**
 * Parse a CSS color string. Currently only hex and rgb(a) are supported.
 *
 * @param {string} color Hex or rgb(a) color string
 *
 * @return {Object} RGB values.
 */
export function parseColor( color = '' ) {
	if ( color.startsWith( '#' ) ) {
		return hex2rgb( color );
	} else if ( color.startsWith( 'rgb' ) ) {
		return cssrgb2rgb( color );
	}
}

/**
 * Convert an RGB object to a CSS hex string.
 *
 * @param {Object} color RGB values.
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
 * @param {string[]} colors CSS color strings
 *
 * @return {string} CSS gradient string for the duotone swatch.
 */
export function getGradientFromColors( colors = [] ) {
	const l = 100 / colors.length;

	const stops = colors
		.map( ( c, i ) => `${ c } ${ i * l }%, ${ c } ${ ( i + 1 ) * l }%` )
		.join( ', ' );

	return `linear-gradient( 135deg, ${ stops } )`;
}

/**
 * Create a CSS gradient for duotone swatches.
 *
 * @param {Object} values R, G, and B values.
 *
 * @return {string} CSS gradient string for the duotone swatch.
 */
export function getGradientFromValues( values = { r: [], g: [], b: [] } ) {
	// R, G, and B should all be the same length, so we only need to map over one.
	const colors = values.r.map( ( x, i ) => {
		return rgb2hex( {
			r: values.r[ i ],
			g: values.g[ i ],
			b: values.b[ i ],
		} );
	} );

	return getGradientFromColors( colors );
}

const COLOR_REGEX = /rgba?\([0-9,\s]*\)|#[a-fA-F0-9]{3,8}/g;

/**
 * Parse out the colors from a CSS gradient.
 *
 * @param {string} cssGradient CSS gradient string.
 *
 * @return {Object} R, G, and B values.
 */
export function parseGradient( cssGradient = '' ) {
	const colors = { r: [], g: [], b: [] };

	let match;
	while ( ( match = COLOR_REGEX.exec( cssGradient ) ) ) {
		const color = parseColor( match[ 0 ] );

		const diffR =
			Math.abs( color.r - colors.r[ colors.r.length - 1 ] ) >
			Number.EPSILON;
		const diffG =
			Math.abs( color.g - colors.g[ colors.g.length - 1 ] ) >
			Number.EPSILON;
		const diffB =
			Math.abs( color.b - colors.b[ colors.b.length - 1 ] ) >
			Number.EPSILON;

		// Only add colors that differ from the previous color.
		if ( colors.r.length === 0 || diffR || diffG || diffB ) {
			colors.r.push( color.r );
			colors.g.push( color.g );
			colors.b.push( color.b );
		}
	}

	return colors;
}
