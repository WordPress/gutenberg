/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

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
import { extractPresetSlug } from '../utils/color-values';
import { store as blockEditorStore } from '../store';
import {
	getStyleForState,
	isDefaultBlockStyleState,
	setStyleForState,
	useBlockStyleState,
} from './block-style-state';
import useBlockColorContrastWarning from './contrast-checker';

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
	const textColorValue = style?.color?.text;
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
	const textColorSlug = extractPresetSlug( textColorValue, 'color' );
	updatedStyle.typography = {
		...omit( updatedStyle.typography, [ 'fontFamily' ] ),
		fontSize: fontSizeSlug ? undefined : fontSizeValue,
	};
	updatedStyle.color = {
		...updatedStyle.color,
		text: textColorSlug ? undefined : textColorValue,
	};
	return {
		style: cleanEmptyObject( updatedStyle ),
		fontFamily: fontFamilySlug,
		fontSize: fontSizeSlug,
		textColor: textColorSlug,
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
		color: {
			...attributes.style?.color,
			text: attributes.textColor
				? 'var:preset|color|' + attributes.textColor
				: attributes.style?.color?.text,
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

export function TypographyPanel( {
	clientId,
	name,
	setAttributes,
	settings,
	// Allows rendering outside the `typography` inspector group (e.g. section
	// blocks direct-render this panel because their support fills are gated
	// off by editing mode). Defaults to the slot-based wrapper.
	asWrapper,
} ) {
	const selectedState = useBlockStyleState();
	const isEnabled = useHasTypographyPanel( settings );

	const { style, fontFamily, fontSize, fitText, textColor } = useSelect(
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
				textColor: _textColor,
			} = select( blockEditorStore ).getBlockAttributes( clientId ) || {};
			return {
				style: _style,
				fontFamily: _fontFamily,
				fontSize: _fontSize,
				fitText: _fitText,
				textColor: _textColor,
			};
		},
		[ clientId, isEnabled ]
	);

	const isStateSelected = ! isDefaultBlockStyleState( selectedState );

	const value = useMemo( () => {
		if ( isStateSelected ) {
			return getStyleForState( style, selectedState );
		}
		return attributesToStyle( { style, fontFamily, fontSize, textColor } );
	}, [
		isStateSelected,
		selectedState,
		style,
		fontSize,
		fontFamily,
		textColor,
	] );

	const onChange = isStateSelected
		? ( newStyle ) => {
				setAttributes( {
					style: setStyleForState( style, selectedState, newStyle ),
				} );
		  }
		: ( newStyle ) => {
				const newAttributes = styleToAttributes( newStyle );

				// If setting a font size and fitText is currently enabled, disable it.
				const hasFontSize =
					newAttributes.fontSize ||
					newAttributes.style?.typography?.fontSize;
				if ( hasFontSize && fitText ) {
					newAttributes.fitText = undefined;
				}

				setAttributes( newAttributes );
		  };

	// Link color failures are reported by the Elements panel, which owns the
	// link color selection.
	const enableContrastChecking =
		! isStateSelected &&
		! value?.color?.gradient &&
		!! value?.color?.text &&
		settings?.color?.text &&
		false !== getBlockSupport( name, [ 'color', 'enableContrastChecker' ] );

	const contrastWarning = useBlockColorContrastWarning( {
		clientId,
		name,
		enabled: !! enableContrastChecking,
		checkLinkColor: false,
		messageOverride: __(
			'This color has poor contrast against the background. Consider increasing contrast.'
		),
	} );

	if ( ! isEnabled ) {
		return null;
	}

	const typographyDefaultControls = getBlockSupport( name, [
		TYPOGRAPHY_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );
	const colorDefaultControls = getBlockSupport( name, [
		'color',
		'__experimentalDefaultControls',
	] );
	const defaultControls = {
		...typographyDefaultControls,
		textColor: colorDefaultControls?.text,
	};

	const Wrapper = asWrapper || TypographyInspectorControl;

	return (
		<StylesTypographyPanel
			as={ Wrapper }
			panelId={ clientId }
			settings={ settings }
			value={ value }
			onChange={ onChange }
			defaultControls={ defaultControls }
			contrastWarning={ contrastWarning }
		/>
	);
}

export const hasTypographySupport = ( blockName ) => {
	return TYPOGRAPHY_SUPPORT_KEYS.some( ( key ) =>
		hasBlockSupport( blockName, key )
	);
};
