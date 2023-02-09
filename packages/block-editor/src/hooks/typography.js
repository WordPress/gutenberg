/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import {
	default as StylesTypographyPanel,
	useHasTypographyPanel,
} from '../components/global-styles/typography-panel';

import { LINE_HEIGHT_SUPPORT_KEY } from './line-height';
import { FONT_FAMILY_SUPPORT_KEY } from './font-family';
import { FONT_SIZE_SUPPORT_KEY } from './font-size';
import { useSetting } from '../components';
import { cleanEmptyObject } from './utils';

function omit( object, keys ) {
	return Object.fromEntries(
		Object.entries( object ).filter( ( [ key ] ) => ! keys.includes( key ) )
	);
}

const LETTER_SPACING_SUPPORT_KEY = 'typography.__experimentalLetterSpacing';
const TEXT_TRANSFORM_SUPPORT_KEY = 'typography.__experimentalTextTransform';
const TEXT_DECORATION_SUPPORT_KEY = 'typography.__experimentalTextDecoration';
const FONT_STYLE_SUPPORT_KEY = 'typography.__experimentalFontStyle';
const FONT_WEIGHT_SUPPORT_KEY = 'typography.__experimentalFontWeight';
export const TYPOGRAPHY_SUPPORT_KEY = 'typography';
export const TYPOGRAPHY_SUPPORT_KEYS = [
	LINE_HEIGHT_SUPPORT_KEY,
	FONT_SIZE_SUPPORT_KEY,
	FONT_STYLE_SUPPORT_KEY,
	FONT_WEIGHT_SUPPORT_KEY,
	FONT_FAMILY_SUPPORT_KEY,
	TEXT_DECORATION_SUPPORT_KEY,
	TEXT_TRANSFORM_SUPPORT_KEY,
	LETTER_SPACING_SUPPORT_KEY,
];

function TypographyInspectorControl( { children } ) {
	return (
		<InspectorControls group="typography">{ children }</InspectorControls>
	);
}

export function TypographyPanel( {
	clientId,
	name,
	attributes,
	setAttributes,
} ) {
	const settings = {
		typography: {
			fontFamilies: {
				custom: useSetting( 'typography.fontFamilies' ),
			},
			fontSizes: {
				custom: useSetting( 'typography.fontSizes' ),
			},
			customFontSize: useSetting( 'typography.customFontSize' ),
			fontStyle: useSetting( 'typography.fontStyle' ),
			fontWeight: useSetting( 'typography.fontWeight' ),
			lineHeight: useSetting( 'typography.lineHeight' ),
			textDecoration: useSetting( 'typography.textDecoration' ),
			textTransform: useSetting( 'typography.textTransform' ),
			letterSpacing: useSetting( 'typography.letterSpacing' ),
		},
	};

	const isSupported = hasTypographySupport( name );
	const isEnabled = useHasTypographyPanel( name, null, settings );

	const value = useMemo( () => {
		return {
			...attributes.style,
			typography: {
				...attributes.style?.typography,
				fontFamily: attributes.fontFamily
					? 'var:preset|font-family|' + attributes.fontFamily
					: undefined,
				fontSize: attributes.fontSize
					? 'var:preset|font-size|' + attributes.fontSize
					: attributes.style?.typography?.fontSize,
			},
		};
	}, [ attributes.style, attributes.fontSize, attributes.fontFamily ] );

	const onChange = ( newStyle ) => {
		const updatedStyle = { ...omit( newStyle, [ 'fontFamily' ] ) };
		const fontSizeValue = newStyle?.typography?.fontSize;
		const fontFamilyValue = newStyle?.typography?.fontFamily;
		const fontSizeSlug = fontSizeValue?.startsWith(
			'var:preset|font-size|'
		)
			? fontSizeValue.substring( 'var:preset|font-size|'.length )
			: undefined;
		const fontFamilySlug = fontFamilyValue?.startsWith(
			'var:preset|font-family|'
		)
			? fontFamilyValue.substring( 'var:preset|font-family|'.length )
			: undefined;
		updatedStyle.typography = {
			...omit( updatedStyle.typography, [ 'fontFamily' ] ),
			fontSize: fontSizeSlug ? undefined : fontSizeValue,
		};
		setAttributes( {
			style: cleanEmptyObject( updatedStyle ),
			fontFamily: fontFamilySlug,
			fontSize: fontSizeSlug,
		} );
	};

	if ( ! isEnabled || ! isSupported ) {
		return null;
	}

	const defaultControls = getBlockSupport( name, [
		TYPOGRAPHY_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

	return (
		<StylesTypographyPanel
			as={ TypographyInspectorControl }
			panelId={ clientId }
			name={ name }
			settings={ settings }
			value={ value }
			onChange={ onChange }
			defaultControls={ defaultControls }
		/>
	);
}

export const hasTypographySupport = ( blockName ) => {
	return TYPOGRAPHY_SUPPORT_KEYS.some( ( key ) =>
		hasBlockSupport( blockName, key )
	);
};
