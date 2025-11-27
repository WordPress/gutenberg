/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

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
import { TEXT_ALIGN_SUPPORT_KEY } from './text-align';
import { FIT_TEXT_SUPPORT_KEY } from './fit-text';
import { cleanEmptyObject } from './utils';
import { store as blockEditorStore } from '../store';

function omit( object, keys ) {
	return Object.fromEntries(
		Object.entries( object ).filter( ( [ key ] ) => ! keys.includes( key ) )
	);
}

const LETTER_SPACING_SUPPORT_KEY = 'typography.__experimentalLetterSpacing';
const TEXT_TRANSFORM_SUPPORT_KEY = 'typography.__experimentalTextTransform';
const TEXT_DECORATION_SUPPORT_KEY = 'typography.__experimentalTextDecoration';
const TEXT_INDENT_SUPPORT_KEY = 'typography.textIndent';
const TEXT_COLUMNS_SUPPORT_KEY = 'typography.textColumns';
const FONT_STYLE_SUPPORT_KEY = 'typography.__experimentalFontStyle';
const FONT_WEIGHT_SUPPORT_KEY = 'typography.__experimentalFontWeight';
const WRITING_MODE_SUPPORT_KEY = 'typography.__experimentalWritingMode';
export const TYPOGRAPHY_SUPPORT_KEY = 'typography';
export const TYPOGRAPHY_SUPPORT_KEYS = [
	LINE_HEIGHT_SUPPORT_KEY,
	FONT_SIZE_SUPPORT_KEY,
	FONT_STYLE_SUPPORT_KEY,
	FONT_WEIGHT_SUPPORT_KEY,
	FONT_FAMILY_SUPPORT_KEY,
	TEXT_ALIGN_SUPPORT_KEY,
	TEXT_COLUMNS_SUPPORT_KEY,
	TEXT_DECORATION_SUPPORT_KEY,
	TEXT_INDENT_SUPPORT_KEY,
	WRITING_MODE_SUPPORT_KEY,
	TEXT_TRANSFORM_SUPPORT_KEY,
	LETTER_SPACING_SUPPORT_KEY,
	FIT_TEXT_SUPPORT_KEY,
];

function styleToAttributes( style ) {
	const updatedStyle = { ...omit( style, [ 'fontFamily' ] ) };
	const fontSizeValue = style?.typography?.fontSize;
	const fontFamilyValue = style?.typography?.fontFamily;
	const fontSizeSlug =
		typeof fontSizeValue === 'string' &&
		fontSizeValue?.startsWith( 'var:preset|font-size|' )
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
	return {
		style: cleanEmptyObject( updatedStyle ),
		fontFamily: fontFamilySlug,
		fontSize: fontSizeSlug,
	};
}

function attributesToStyle( attributes ) {
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
}

function TypographyInspectorControl( { children, resetAllFilter } ) {
	const attributesResetAllFilter = useCallback(
		( attributes ) => {
			const existingStyle = attributesToStyle( attributes );
			const updatedStyle = resetAllFilter( existingStyle );
			return {
				...attributes,
				...styleToAttributes( updatedStyle ),
			};
		},
		[ resetAllFilter ]
	);

	return (
		<InspectorControls
			group="typography"
			resetAllFilter={ attributesResetAllFilter }
		>
			{ children }
		</InspectorControls>
	);
}

export function TypographyPanel( { clientId, name, setAttributes, settings } ) {
	const isEnabled = useHasTypographyPanel( settings );

	const { style, fontFamily, fontSize, fitText } = useSelect(
		( select ) => {
			// Early return to avoid subscription when disabled.
			if ( ! isEnabled ) {
				return {};
			}
			const {
				style: _style,
				fontFamily: _fontFamily,
				fontSize: _fontSize,
				fitText: _fitText,
			} = select( blockEditorStore ).getBlockAttributes( clientId ) || {};
			return {
				style: _style,
				fontFamily: _fontFamily,
				fontSize: _fontSize,
				fitText: _fitText,
			};
		},
		[ clientId, isEnabled ]
	);
	const value = useMemo(
		() => attributesToStyle( { style, fontFamily, fontSize } ),
		[ style, fontSize, fontFamily ]
	);

	const onChange = ( newStyle ) => {
		const newAttributes = styleToAttributes( newStyle );

		// If setting a font size and fitText is currently enabled, disable it
		const hasFontSize =
			newAttributes.fontSize || newAttributes.style?.typography?.fontSize;
		if ( hasFontSize && fitText ) {
			newAttributes.fitText = undefined;
		}

		setAttributes( newAttributes );
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
