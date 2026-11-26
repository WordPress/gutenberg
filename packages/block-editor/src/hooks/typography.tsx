import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
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
import { setImmutably } from '../utils/object';
import { store as blockEditorStore } from '../store';
import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	hasPseudoBlockStyleState,
	hasViewportBlockStyleState,
	isDefaultBlockStyleState,
	setStyleForState,
	useBlockStyleState,
} from './block-style-state';
import useBlockColorContrastWarning from './contrast-checker';
import type { PanelStyle } from '../components/global-styles/types';
import type {
	BlockStyleState,
	ResetAllContext,
	ResetAllFilter,
	StyleInspectorControlProps,
	TypographyAttributes,
	TypographyHookPanelProps,
} from './types';

function omit< T extends object >( object: T, keys: string[] ) {
	// Leaving keys out keeps the rest of the shape.
	return Object.fromEntries(
		Object.entries( object ).filter( ( [ key ] ) => ! keys.includes( key ) )
	) as Partial< T >;
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

function styleToAttributes( style: PanelStyle ): TypographyAttributes {
	const updatedStyle: PanelStyle = { ...omit( style, [ 'fontFamily' ] ) };
	const fontSizeValue = style?.typography?.fontSize;
	const fontFamilyValue = style?.typography?.fontFamily;
	const textColorValue = style?.color?.text;
	const textShadowValue = style?.typography?.textShadow;
	const fontSizeSlug =
		typeof fontSizeValue === 'string' &&
		fontSizeValue?.startsWith( 'var:preset|font-size|' )
			? fontSizeValue.substring( 'var:preset|font-size|'.length )
			: undefined;
	// A font family is stored as a string.
	const fontFamilySlug = (
		fontFamilyValue as string | undefined
	 )?.startsWith( 'var:preset|font-family|' )
		? ( fontFamilyValue as string ).substring(
				'var:preset|font-family|'.length
			)
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
		// The panel styles always hold typography.
		...omit( updatedStyle.typography as Record< string, unknown >, [
			'fontFamily',
		] ),
		fontSize: fontSizeSlug ? undefined : fontSizeValue,
		textShadow: textShadowSlug ? undefined : textShadowValue,
	};
	updatedStyle.color = {
		...updatedStyle.color,
		text: textColorSlug ? undefined : textColorValue,
		// Read only (see `attributesToStyle`). A preset stays in its attribute.
		background: backgroundColorSlug ? undefined : backgroundColorValue,
	};
	return {
		// Cleaning leaves out only the empty values.
		style: cleanEmptyObject( updatedStyle ) as PanelStyle | undefined,
		fontFamily: fontFamilySlug,
		fontSize: fontSizeSlug,
		textColor: textColorSlug,
		textShadow: textShadowSlug,
	};
}

function attributesToStyle( attributes: TypographyAttributes ): PanelStyle {
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
		// Read only, for the notice about clipping the block's background.
		// `onChange` restores whatever gradient the block actually had.
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
			background: attributes.backgroundColor
				? 'var:preset|color|' + attributes.backgroundColor
				: attributes.style?.color?.background,
		},
	};
}

/**
 * Returns the font size a selected state inherits from the block's own
 * styles, in the order the block's state CSS applies (see `states.php`).
 * The block's state rules outrank Global Styles, so the result comes before
 * the Global Styles value.
 *
 * A viewport and pseudo state, such as Tablet + Hover, inherits the pseudo
 * state of the default viewport first: its `:hover` selector is more specific
 * than the viewport's own rule. Then come the viewport and the default state.
 *
 * @param style         The block's `style` attribute.
 * @param baseValue     The block's default state style.
 * @param selectedState Selected block style state.
 * @return The inherited font size, when the block sets one.
 */
function getBlockInheritedFontSize(
	style: TypographyAttributes[ 'style' ],
	baseValue: PanelStyle,
	selectedState: BlockStyleState
) {
	if ( isDefaultBlockStyleState( selectedState ) ) {
		return undefined;
	}

	const layers: Array< PanelStyle | undefined > = [];
	if (
		hasViewportBlockStyleState( selectedState ) &&
		hasPseudoBlockStyleState( selectedState )
	) {
		layers.push(
			getStyleForState( style, {
				...selectedState,
				viewport: DEFAULT_BLOCK_STYLE_STATE.viewport,
			} ) as PanelStyle | undefined,
			getStyleForState( style, {
				...selectedState,
				pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
			} ) as PanelStyle | undefined
		);
	}
	layers.push( baseValue );

	return layers.find( ( layer ) => layer?.typography?.fontSize !== undefined )
		?.typography?.fontSize;
}

function TypographyInspectorControl( {
	children,
	resetAllFilter,
}: StyleInspectorControlProps ) {
	const attributesResetAllFilter = useCallback(
		( attributes: TypographyAttributes, context?: ResetAllContext ) => {
			// "Reset all" passes `style` as the first argument and the block's other
			// attributes in `context`. A palette text color is saved in `textColor`,
			// so add it, or the reset can't tell that the link color matches it.
			const existingStyle = attributesToStyle( {
				textColor: context?.attributes?.textColor as string | undefined,
				...attributes,
			} );
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
			// The filter reads the typography attributes.
			resetAllFilter={ attributesResetAllFilter as ResetAllFilter }
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
}: TypographyHookPanelProps ) {
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
	}: TypographyAttributes = useSelect(
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
			} = ( select( blockEditorStore ).getBlockAttributes( clientId ) ||
				// The block's attributes hold its typography.
				{} ) as TypographyAttributes;
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

	const { value: resolvedValue } = useResolvedStyle(
		name,
		className,
		selectedState
	);

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

	const inheritedValue = useMemo( () => {
		const inheritedFontSize = getBlockInheritedFontSize(
			style,
			baseValue,
			selectedState
		);
		return inheritedFontSize === undefined
			? resolvedValue
			: ( setImmutably(
					resolvedValue,
					[ 'typography', 'fontSize' ],
					inheritedFontSize
				) as PanelStyle );
	}, [ style, baseValue, selectedState, resolvedValue ] );

	const value = useMemo(
		() =>
			isStateSelected
				? // The state styles have the shape of the block styles.
					( getStyleForState( style, selectedState ) as
						PanelStyle | undefined )
				: baseValue,
		[ isStateSelected, selectedState, style, baseValue ]
	);

	const onChange = isStateSelected
		? ( newStyle: PanelStyle ) => {
				setAttributes( {
					style: setStyleForState( style, selectedState, newStyle ),
				} );
			}
		: ( newStyle: PanelStyle ) => {
				const newAttributes = styleToAttributes( newStyle );

				const setsTextGradient =
					'text' === newStyle?.background?.backgroundClip;
				const hadTextGradient =
					'text' === style?.background?.backgroundClip;

				// Only a text gradient belongs to this panel. Put any other
				// gradient back as the block had it.
				if ( ! setsTextGradient && ! hadTextGradient ) {
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
						// Cleaning leaves out only the empty values.
					} ) as PanelStyle | undefined;
				} else if ( setsTextGradient && gradient ) {
					// A preset gradient's `background` shorthand resets the clip.
					newAttributes.gradient = undefined;
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

	// The Elements panel reports link color failures and the Background panel
	// a solid color clipped to the text, since those panels own the colors.
	const hasTextGradient =
		'text' === value?.background?.backgroundClip &&
		!! value?.background?.gradient;
	// The Gradient control shows without the text color setting.
	const enableContrastChecking =
		! value?.color?.gradient &&
		( 'text' === value?.background?.backgroundClip
			? hasTextGradient
			: !! value?.color?.text && settings?.color?.text ) &&
		false !== getBlockSupport( name, [ 'color', 'enableContrastChecker' ] );

	const contrastWarning = useBlockColorContrastWarning( {
		clientId,
		name,
		enabled: !! enableContrastChecking,
		checkLinkColor: false,
		messageOverride: hasTextGradient
			? __(
					'Part of this gradient has poor contrast against the background. Consider increasing contrast.'
				)
			: __(
					'This color has poor contrast against the background. Consider increasing contrast.'
				),
	} );

	if ( ! isEnabled ) {
		return null;
	}

	// The default controls map control names to whether they show.
	const typographyDefaultControls = getBlockSupport( name, [
		TYPOGRAPHY_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] ) as Record< string, boolean > | undefined;
	const colorDefaultControls = getBlockSupport( name, [
		'color',
		'__experimentalDefaultControls',
	] ) as Record< string, boolean > | undefined;
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
			baseValue={ isStateSelected ? baseValue : undefined }
			onChange={ onChange }
			defaultControls={ defaultControls }
			contrastWarning={ contrastWarning }
			inheritedValue={ inheritedValue }
		/>
	);
}

export const hasTypographySupport = ( blockName: string | BlockType ) => {
	return TYPOGRAPHY_SUPPORT_KEYS.some( ( key ) =>
		hasBlockSupport( blockName, key )
	);
};
