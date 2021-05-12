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

export const FONT_FAMILY_SUPPORT_KEY = '__experimentalFontFamily';

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
	name,
	setAttributes,
	attributes: { style = {} },
} ) {
	const fontFamilies = useSetting( 'typography.fontFamilies' );
	const isDisable = useIsFontFamilyDisabled( { name } );

	if ( isDisable ) {
		return null;
	}

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
