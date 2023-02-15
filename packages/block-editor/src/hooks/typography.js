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
import {
	overrideSettingsWithSupports,
	useSupportedStyles,
} from '../components/global-styles/hooks';

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

function useBlockSettings( name ) {
	const fontFamilies = useSetting( 'typography.fontFamilies' );
	const fontSizes = useSetting( 'typography.fontSizes' );
	const customFontSize = useSetting( 'typography.customFontSize' );
	const fontStyle = useSetting( 'typography.fontStyle' );
	const fontWeight = useSetting( 'typography.fontWeight' );
	const lineHeight = useSetting( 'typography.lineHeight' );
	const textDecoration = useSetting( 'typography.textDecoration' );
	const textTransform = useSetting( 'typography.textTransform' );
	const letterSpacing = useSetting( 'typography.letterSpacing' );
	const supports = useSupportedStyles( name, null );

	return useMemo( () => {
		const rawSettings = {
			typography: {
				fontFamilies: {
					custom: fontFamilies,
				},
				fontSizes: {
					custom: fontSizes,
				},
				customFontSize,
				fontStyle,
				fontWeight,
				lineHeight,
				textDecoration,
				textTransform,
				letterSpacing,
			},
		};
		return overrideSettingsWithSupports( rawSettings, supports );
	}, [
		fontFamilies,
		fontSizes,
		customFontSize,
		fontStyle,
		fontWeight,
		lineHeight,
		textDecoration,
		textTransform,
		letterSpacing,
		supports,
	] );
}

export function TypographyPanel( {
	clientId,
	name,
	attributes,
	setAttributes,
} ) {
	const settings = useBlockSettings( name );
	const isEnabled = useHasTypographyPanel( settings );
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

	if ( ! isEnabled ) {
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
