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
 *
 * @param {Array} fontFamilyFaces font family faces array
 * @return {Object} new object with font style and weight options
 */
export function getFontStylesAndWeights( fontFamilyFaces ) {
	if ( ! fontFamilyFaces ) {
		return {};
	}

	let fontStyles = [];
	let fontWeights = [];
	let variableFont = false;

	fontFamilyFaces.forEach( ( face ) => {
		if ( face.fontStyle ) {
			if (
				! fontStyles.some( ( style ) => style.value === face.fontStyle )
			) {
				fontStyles.push( formatFontStyle( face.fontStyle ) );
			}
		}
		if ( face.fontWeight ) {
			if (
				! fontWeights.some(
					( weight ) => weight.value === face.fontWeight
				)
			) {
				// Remove any leading or trailing whitespace from the font weight.
				face.fontWeight.trim();

				// Check if font weight includes a space, if so it must be a variable font.
				if ( /\s/.test( face.fontWeight ) ) {
					variableFont = true;
				}

				fontWeights.push( formatFontWeight( face.fontWeight ) );
			}
		}
	} );

	fontStyles =
		fontStyles.length === 0 || variableFont ? FONT_STYLES : fontStyles;
	fontWeights =
		fontWeights.length === 0 || variableFont ? FONT_WEIGHTS : fontWeights;

	return { fontStyles, fontWeights };
}
