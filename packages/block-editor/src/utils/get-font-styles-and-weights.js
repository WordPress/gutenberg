/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { formatFontStyle } from './format-font-style';
import { formatFontWeight } from './format-font-weight';

const FONT_STYLES = [
	{
		name: _x( 'Regular', 'font style' ),
		value: 'normal',
	},
	{
		name: _x( 'Italic', 'font style' ),
		value: 'italic',
	},
];

const FONT_WEIGHTS = [
	{
		name: _x( 'Thin', 'font weight' ),
		value: '100',
	},
	{
		name: _x( 'Extra Light', 'font weight' ),
		value: '200',
	},
	{
		name: _x( 'Light', 'font weight' ),
		value: '300',
	},
	{
		name: _x( 'Regular', 'font weight' ),
		value: '400',
	},
	{
		name: _x( 'Medium', 'font weight' ),
		value: '500',
	},
	{
		name: _x( 'Semi Bold', 'font weight' ),
		value: '600',
	},
	{
		name: _x( 'Bold', 'font weight' ),
		value: '700',
	},
	{
		name: _x( 'Extra Bold', 'font weight' ),
		value: '800',
	},
	{
		name: _x( 'Black', 'font weight' ),
		value: '900',
	},
];

/**
 * Builds a list of font style and weight options based on font family faces.
 * Defaults to the standard font styles and weights if no font family faces are provided.
 *
 * @param {Array} fontFamilyFaces font family faces array
 * @return {Object} new object with font style, weight, and variable font properties
 */
export function getFontStylesAndWeights( fontFamilyFaces ) {
	const allStylesAndWeights = [];
	let fontStyles = [];
	let fontWeights = [];
	let isVariableFont = false;

	if ( ! fontFamilyFaces ) {
		// Return default font styles and weights if no font family faces are provided.
		return { fontStyles: FONT_STYLES, fontWeights: FONT_WEIGHTS };
	}

	fontFamilyFaces.forEach( ( face ) => {
		const fontStyle = formatFontStyle( face.fontStyle );
		const fontWeight = formatFontWeight( face.fontWeight );
		const optionName =
			fontStyle.value === 'normal'
				? fontWeight.name
				: `${ fontWeight.name } ${ fontStyle.name }`;

		allStylesAndWeights.push( {
			key: `${ fontWeight.value }-${ fontStyle.value }`,
			name: optionName,
			style: {
				fontStyle: fontStyle.value,
				fontWeight: fontWeight.value,
			},
		} );

		if ( fontStyle ) {
			if (
				! fontStyles.some(
					( style ) => style.value === fontStyle.value
				)
			) {
				fontStyles.push( fontStyle );
			}
		}
		if ( fontWeight ) {
			if (
				! fontWeights.some(
					( weight ) => weight.value === fontWeight.value
				)
			) {
				// Check if font weight includes a space that is not at the start or end of the string. If so, it must be a variable font. e.g. "100 900"
				if ( /\s/.test( face.fontWeight.trim() ) ) {
					isVariableFont = true;
				}

				fontWeights.push( fontWeight );
			}
		}
	} );

	fontStyles =
		fontStyles.length === 0 || isVariableFont ? FONT_STYLES : fontStyles;
	fontWeights =
		fontWeights.length === 0 || isVariableFont ? FONT_WEIGHTS : fontWeights;

	return { allStylesAndWeights, fontStyles, fontWeights, isVariableFont };
}
