/**
 * External dependencies
 */
import { find, kebabCase } from 'lodash-es';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Provided an array of color objects as set by the theme or by the editor defaults,
 * and the values of the defined color or custom color returns a color object describing the color.
 *
 * @param {Array}   colors       Array of color objects as set by the theme or by the editor defaults.
 * @param {?string} definedColor A string containing the color slug.
 * @param {?string} customColor  A string containing the customColor value.
 *
 * @return {?string} If definedColor is passed and the name is found in colors,
 *                   the color object exactly as set by the theme or editor defaults is returned.
 *                   Otherwise, an object that just sets the color is defined.
 */
export const getColorObjectByAttributeValues = ( colors, definedColor, customColor ) => {
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

/**
* Provided an array of color objects as set by the theme or by the editor defaults, and a color value returns the color object matching that value or undefined.
*
* @param {Array}   colors      Array of color objects as set by the theme or by the editor defaults.
* @param {?string} colorValue  A string containing the color value.
*
* @return {?string} Returns the color object included in the colors array whose color property equals colorValue.
*                   Returns undefined if no color object matches this requirement.
*/
export const getColorObjectByColorValue = ( colors, colorValue ) => {
	return find( colors, { color: colorValue } );
};

/**
* Provided an array of named colors and a color value returns the color name.
*
* @param {Array}   colors      Array of color objects containing the "name" and "color" value as properties.
* @param {?string} colorValue  A string containing the color value.
*
* @return {?string} If colorValue is defined and matches a color part of the colors array, it returns the color name for that color.
*/
export const getColorName = ( colors, colorValue ) => {
	deprecated( 'getColorName function', {
		version: '3.9',
		alternative: '`getColorObjectByColorValue` function',
		plugin: 'Gutenberg',
	} );
	const colorObj = getColorObjectByColorValue( colors, colorValue );
	return colorObj ? colorObj.name : undefined;
};

/**
 * Returns a class based on the context a color is being used and its slug.
 *
 * @param {string} colorContextName Context/place where color is being used e.g: background, text etc...
 * @param {string} colorSlug        Slug of the color.
 *
 * @return {string} String with the class corresponding to the color in the provided context.
 */
export function getColorClassName( colorContextName, colorSlug ) {
	if ( ! colorContextName || ! colorSlug ) {
		return;
	}

	return `has-${ kebabCase( colorSlug ) }-${ colorContextName }`;
}

export function getColorClass( colorContextName, colorSlug ) {
	deprecated( 'getColorClass function', {
		version: '3.9',
		alternative: '`getColorClassName` function',
		plugin: 'Gutenberg',
	} );
	return getColorClassName( colorContextName, colorSlug );
}
