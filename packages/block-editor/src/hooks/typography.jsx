import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import InspectorControls from '../components/inspector-controls';
import {
	default as StylesTypographyPanel,
	useHasTypographyPanel,
} from '../components/global-styles/typography-panel';
import { useResolvedStyle } from '../components/global-styles/inherited-value-context';
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
const TEXT_SHADOW_SUPPORT_KEY = 'typography.textShadow';
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
	TEXT_SHADOW_SUPPORT_KEY,
	FIT_TEXT_SUPPORT_KEY,
];

function styleToAttributes( style ) {
	const updatedStyle = { ...omit( style, [ 'fontFamily' ] ) };
	const fontSizeValue = style?.typography?.fontSize;
	const fontFamilyValue = style?.typography?.fontFamily;
	const textColorValue = style?.color?.text;
	const textShadowValue = style?.typography?.textShadow;
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
	const backgroundColorValue = style?.color?.background;
	const backgroundColorSlug = extractPresetSlug(
		backgroundColorValue,
		'color'
	);
	const textShadowSlug =
		typeof textShadowValue === 'string' &&
		textShadowValue?.startsWith( 'var:preset|text-shadow|' )
			? textShadowValue.substring( 'var:preset|text-shadow|'.length )
			: undefined;
	updatedStyle.typography = {
		...omit( updatedStyle.typography, [ 'fontFamily' ] ),
		fontSize: fontSizeSlug ? undefined : fontSizeValue,
		textShadow: textShadowSlug ? undefined : textShadowValue,
	};
	updatedStyle.color = {
		...updatedStyle.color,
		text: textColorSlug ? undefined : textColorValue,
		// The Background panel owns this. A preset lives in the
		// `backgroundColor` attribute, so writing it here too would store it
		// twice; a custom color already lives here and is left alone.
		background: backgroundColorSlug ? undefined : backgroundColorValue,
	};
	return {
		style: cleanEmptyObject( updatedStyle ),
		fontFamily: fontFamilySlug,
		fontSize: fontSizeSlug,
		textColor: textColorSlug,
		textShadow: textShadowSlug,
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
			textShadow: attributes.textShadow
				? 'var:preset|text-shadow|' + attributes.textShadow
				: attributes.style?.typography?.textShadow,
		},
		// Read only, so the panel can tell a text gradient would clip the
		// block's background away. A gradient has three homes: the `gradient`
		// attribute for a preset, `color.gradient` for a custom one set before
		// the background support existed, and `background.gradient` since.
		// `onChange` puts back whatever the block actually had.
		background: {
			...attributes.style?.background,
			gradient: attributes.gradient
				? 'var:preset|gradient|' + attributes.gradient
				: ( attributes.style?.background?.gradient ??
					attributes.style?.color?.gradient ),
		},
		color: {
			...attributes.style?.color,
			text: attributes.textColor
				? 'var:preset|color|' + attributes.textColor
				: attributes.style?.color?.text,
			// Read only. `styleToAttributes` folds it back out.
			background: attributes.backgroundColor
				? 'var:preset|color|' + attributes.backgroundColor
				: attributes.style?.color?.background,
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

	const {
		style,
		fontFamily,
		fontSize,
		fitText,
		textColor,
		textShadow,
		className,
		backgroundColor,
		gradient,
	} = useSelect(
		( select ) => {
			// Early return to avoid subscription when disabled.
			if ( ! isEnabled ) {
				return {};
			}
			const {
				style: _style,
				fontFamily: _fontFamily,
				fontSize: _fontSize,
				textShadow: _textShadow,
				fitText: _fitText,
				textColor: _textColor,
				className: _className,
				backgroundColor: _backgroundColor,
				gradient: _gradient,
			} = select( blockEditorStore ).getBlockAttributes( clientId ) || {};
			return {
				style: _style,
				fontFamily: _fontFamily,
				fontSize: _fontSize,
				fitText: _fitText,
				textColor: _textColor,
				textShadow: _textShadow,
				className: _className,
				backgroundColor: _backgroundColor,
				gradient: _gradient,
			};
		},
		[ clientId, isEnabled ]
	);

	const isStateSelected = ! isDefaultBlockStyleState( selectedState );

	const { value: inheritedValue } = useResolvedStyle(
		name,
		className,
		selectedState
	);

	// The block's Default state, which every other state layers over.
	const baseValue = useMemo(
		() =>
			attributesToStyle( {
				style,
				fontFamily,
				fontSize,
				textColor,
				textShadow,
				backgroundColor,
				gradient,
			} ),
		[
			style,
			fontSize,
			fontFamily,
			textColor,
			textShadow,
			backgroundColor,
			gradient,
		]
	);

	const value = useMemo(
		() =>
			isStateSelected
				? getStyleForState( style, selectedState )
				: baseValue,
		[ isStateSelected, selectedState, style, baseValue ]
	);

	const onChange = isStateSelected
		? ( newStyle ) => {
				setAttributes( {
					style: setStyleForState( style, selectedState, newStyle ),
				} );
			}
		: ( newStyle ) => {
				const newAttributes = styleToAttributes( newStyle );

				// Only a text gradient belongs to this panel, so any other
				// gradient goes back exactly as the block had it.
				if ( 'text' !== newStyle?.background?.backgroundClip ) {
					newAttributes.style = cleanEmptyObject( {
						...newAttributes.style,
						background: {
							...newAttributes.style?.background,
							gradient: style?.background?.gradient,
						},
						color: {
							...newAttributes.style?.color,
							gradient: style?.color?.gradient,
						},
					} );
				}

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
			blockName={ name }
			value={ value }
			// The selected state layers over the block's Default state, so
			// the panel needs that value to know what still applies here.
			baseValue={ isStateSelected ? baseValue : undefined }
			styleState={ selectedState }
			onChange={ onChange }
			defaultControls={ defaultControls }
			contrastWarning={ contrastWarning }
			inheritedValue={ inheritedValue }
		/>
	);
}

export const hasTypographySupport = ( blockName ) => {
	return TYPOGRAPHY_SUPPORT_KEYS.some( ( key ) =>
		hasBlockSupport( blockName, key )
	);
};
