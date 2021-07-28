/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';
import useSetting from '../components/use-setting';
import FontFamilyControl from '../components/font-family';

export const FONT_FAMILY_SUPPORT_KEY = 'typography.__experimentalFontFamily';

const getFontFamilyFromAttributeValue = ( fontFamilies, value ) => {
	const attributeParsed = /var:preset\|font-family\|(.+)/.exec( value );
	if ( attributeParsed && attributeParsed[ 1 ] ) {
		const fontFamilyObject = find( fontFamilies, ( { slug } ) => {
			return slug === attributeParsed[ 1 ];
		} );
		if ( fontFamilyObject ) {
			return fontFamilyObject.fontFamily;
		}
	}
	return value;
};

export function FontFamilyEdit( {
	setAttributes,
	attributes: { style = {} },
} ) {
	const fontFamilies = useSetting( 'typography.fontFamilies' );

	const value = getFontFamilyFromAttributeValue(
		fontFamilies,
		style.typography?.fontFamily
	);

	function onChange( newValue ) {
		const predefinedFontFamily = find(
			fontFamilies,
			( { fontFamily } ) => fontFamily === newValue
		);
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...( style.typography || {} ),
					fontFamily: predefinedFontFamily
						? `var:preset|font-family|${ predefinedFontFamily.slug }`
						: newValue || undefined,
				},
			} ),
		} );
	}

	return (
		<FontFamilyControl
			className="block-editor-hooks-font-family-control"
			fontFamilies={ fontFamilies }
			value={ value }
			onChange={ onChange }
		/>
	);
}

/**
 * Custom hook that checks if font-family functionality is disabled.
 *
 * @param {string} name The name of the block.
 * @return {boolean} Whether setting is disabled.
 */
export function useIsFontFamilyDisabled( { name } ) {
	const fontFamilies = useSetting( 'typography.fontFamilies' );
	return (
		! fontFamilies ||
		fontFamilies.length === 0 ||
		! hasBlockSupport( name, FONT_FAMILY_SUPPORT_KEY )
	);
}

/**
 * Checks if there is a current value set for the font family block support.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a font family value set.
 */
export function hasFontFamilyValue( props ) {
	return !! props.attributes.style?.typography?.fontFamily;
}

/**
 * Resets the font family block support attribute. This can be used when
 * disabling the font family support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetFontFamily( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			typography: {
				...style?.typography,
				fontFamily: undefined,
			},
		} ),
	} );
}
