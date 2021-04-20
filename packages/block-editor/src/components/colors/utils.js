/**
 * External dependencies
 */
import { find, kebabCase, map, startsWith } from 'lodash';
import tinycolor from 'tinycolor2';

/**
 * Provided an array of color objects as set by the theme or by the editor defaults,
 * and the values of the defined color or custom color returns a color object describing the color.
 *
 * @param {Array}   colors       Array of color objects as set by the theme or by the editor defaults.
 * @param {?string} definedColor A string containing the color slug.
 * @param {?string} customColor  A string containing the customColor value.
 *
 * @return {?Object} If definedColor is passed and the name is found in colors,
 *                   the color object exactly as set by the theme or editor defaults is returned.
 *                   Otherwise, an object that just sets the color is defined.
 */
export const getColorObjectByAttributeValues = (
	colors,
	definedColor,
	customColor
) => {
	if ( definedColor ) {
		const colorObj = find( colors, { slug: definedColor } );

		if ( colorObj ) {
			return colorObj;
		}
	}
	return {
		color: customColor,
	};
};

export const getVariableColorFromAttributeValue = ( colors, value ) => {
	const attributeParsed = /var:preset\|color\|(.+)/.exec( value );
	if ( attributeParsed && attributeParsed[ 1 ] ) {
		return getColorObjectByAttributeValues( colors, attributeParsed[ 1 ] );
	}
	return value;
};

export const compileStyleValue = ( uncompiledValue ) => {
	const VARIABLE_REFERENCE_PREFIX = 'var:';
	const VARIABLE_PATH_SEPARATOR_TOKEN_ATTRIBUTE = '|';
	const VARIABLE_PATH_SEPARATOR_TOKEN_STYLE = '--';
	if ( startsWith( uncompiledValue, VARIABLE_REFERENCE_PREFIX ) ) {
		const variable = uncompiledValue
			.slice( VARIABLE_REFERENCE_PREFIX.length )
			.split( VARIABLE_PATH_SEPARATOR_TOKEN_ATTRIBUTE )
			.join( VARIABLE_PATH_SEPARATOR_TOKEN_STYLE );
		return `var(--wp--${ variable })`;
	}
	return uncompiledValue;
};

/**
 * Provided an array of color objects as set by the theme or by the editor defaults, and a color value returns the color object matching that value or undefined.
 *
 * @param {Array}   colors      Array of color objects as set by the theme or by the editor defaults.
 * @param {?string} colorValue  A string containing the color value.
 *
 * @return {?Object} Color object included in the colors array whose color property equals colorValue.
 *                   Returns undefined if no color object matches this requirement.
 */
export const getColorObjectByColorValue = ( colors, colorValue ) => {
	return find( colors, { color: colorValue } );
};

/**
 * Returns a class based on the context a color is being used and its slug.
 *
 * @param {string} colorContextName Context/place where color is being used e.g: background, text etc...
 * @param {string} colorSlug        Slug of the color.
 *
 * @return {?string} String with the class corresponding to the color in the provided context.
 *                   Returns undefined if either colorContextName or colorSlug are not provided.
 */
export function getColorClassName( colorContextName, colorSlug ) {
	if ( ! colorContextName || ! colorSlug ) {
		return undefined;
	}

	return `has-${ kebabCase( colorSlug ) }-${ colorContextName }`;
}

/**
 * Given an array of color objects and a color value returns the color value of the most readable color in the array.
 *
 * @param {Array}   colors     Array of color objects as set by the theme or by the editor defaults.
 * @param {?string} colorValue A string containing the color value.
 *
 * @return {string} String with the color value of the most readable color.
 */
export function getMostReadableColor( colors, colorValue ) {
	return tinycolor
		.mostReadable( colorValue, map( colors, 'color' ) )
		.toHexString();
}
