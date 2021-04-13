/**
 * External dependencies
 */
import colorize from 'tinycolor2';

/**
 * @param {Record<string, import('tinycolor2').ColorInput>} colors
 * @return {Record<string, import('tinycolor2').ColorInput>} Text colors.
 */
export function createTextColors( colors ) {
	/** @type {Record<string, import('tinycolor2').ColorInput>} */
	const colorSet = {};
	const entries = Object.entries( colors );
	const light = entries[ 0 ][ 1 ];
	const lighter = colorize( light ).lighten( 15 ).toHexString();
	const dark = entries[ entries.length - 1 ][ 1 ];
	const darker = colorize( dark ).darken( 15 ).toHexString();

	for ( const [ color, value ] of entries ) {
		colorSet[ `${ color }Text` ] = colorize
			.mostReadable( value, [ lighter, light, dark, darker ] )
			.toHexString();
	}

	return colorSet;
}

/**
 *
 * @param {Record<string, import('tinycolor2').ColorInput>} colors
 * @param {boolean} [isDark=false]
 * @return {Record<string, import('tinycolor2').ColorInput>} Rgba colors.
 */
export function createRgbaColors( colors, isDark = false ) {
	/** @type {Record<string, import('tinycolor2').ColorInput>} */
	const colorSet = {};
	const entries = Object.entries( colors );
	const [ baseColorName, baseColorValue ] = entries[ 2 ];
	const [ colorName ] = baseColorName.split( /\d+/ );

	const ranges = [ 10, 20, 30, 40, 50, 60, 70, 80, 90 ];

	const mixBase = isDark ? '#000' : '#fff';
	const readabilityTextBase = isDark ? '#fff' : '#000';
	const adjustMethod = isDark ? 'darken' : 'lighten';

	ranges.forEach( ( range, index ) => {
		let enhancedColorValue = baseColorValue;

		enhancedColorValue = colorize( enhancedColorValue )
			.setAlpha( range / 100 )
			.toRgbString();

		const testColor = colorize
			.mix( baseColorValue, mixBase, index )
			.toRgbString();

		const isReadable = colorize.isReadable(
			testColor,
			readabilityTextBase,
			{}
		);

		if ( ! isReadable ) {
			enhancedColorValue = colorize( enhancedColorValue )
				[ adjustMethod ]( 20 )
				.toRgbString();
		}

		colorSet[ `${ colorName }Rgba${ range }` ] = enhancedColorValue;
	} );

	return colorSet;
}

/**
 * @param {string} key
 * @param {import('tinycolor2').ColorInput} color
 * @return {Record<string, import('tinycolor2').ColorInput>} Rgb colors.
 */
export function generateRgbColors( key, color ) {
	/** @type {Record<string, import('tinycolor2').ColorInput>} */
	const colorSet = {
		[ key ]: color,
	};

	const ranges = [ 10, 20, 30, 40, 50, 60, 70, 80, 90 ];

	ranges.forEach( ( index ) => {
		colorSet[ `${ key }Rgba${ index }` ] = colorize( color )
			.setAlpha( index / 100 )
			.toRgbString();
	} );

	return colorSet;
}

/**
 * @param {import('tinycolor2').ColorInput} color
 */
export function generateColorAdminColors( color ) {
	return generateRgbColors( 'colorAdmin', color );
}

/**
 * @param {import('tinycolor2').ColorInput} color
 */
export function generateColorDestructiveColors( color ) {
	return generateRgbColors( 'colorDestructive', color );
}
