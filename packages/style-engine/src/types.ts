/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

type BoxVariant = 'margin' | 'padding';
export interface Box< T extends BoxVariant | undefined = undefined > {
	top?: CSSProperties[ T extends undefined ? 'top' : `${ T }Top` ];
	right?: CSSProperties[ T extends undefined ? 'right' : `${ T }Right` ];
	bottom?: CSSProperties[ T extends undefined ? 'bottom' : `${ T }Bottom` ];
	left?: CSSProperties[ T extends undefined ? 'left' : `${ T }Left` ];
}

export type BoxEdge = 'top' | 'right' | 'bottom' | 'left';

// `T` is one of the values in `BorderIndividualProperty`. The expected CSSProperties key is something like `borderTopColor`.
export interface BorderIndividualStyles< T extends BoxEdge > {
	color?: CSSProperties[ `border${ Capitalize< T > }Color` ];
	style?: CSSProperties[ `border${ Capitalize< T > }Style` ];
	width?: CSSProperties[ `border${ Capitalize< T > }Width` ];
}

export interface Style {
	background?: {
		backgroundImage?:
			| { url?: CSSProperties[ 'backgroundImage' ]; source?: string }
			| CSSProperties[ 'backgroundImage' ];
		backgroundPosition?: CSSProperties[ 'backgroundPosition' ];
		backgroundRepeat?: CSSProperties[ 'backgroundRepeat' ];
		backgroundSize?: CSSProperties[ 'backgroundSize' ];
	};
	border?: {
		color?: CSSProperties[ 'borderColor' ];
		radius?:
			| CSSProperties[ 'borderRadius' ]
			| {
					topLeft?: CSSProperties[ 'borderTopLeftRadius' ];
					topRight?: CSSProperties[ 'borderTopRightRadius' ];
					bottomLeft?: CSSProperties[ 'borderBottomLeftRadius' ];
					bottomRight?: CSSProperties[ 'borderBottomLeftRadius' ];
			  };
		style?: CSSProperties[ 'borderStyle' ];
		width?: CSSProperties[ 'borderWidth' ];
		top?: BorderIndividualStyles< 'top' >;
		right?: BorderIndividualStyles< 'right' >;
		bottom?: BorderIndividualStyles< 'bottom' >;
		left?: BorderIndividualStyles< 'left' >;
	};
	dimensions?: {
		aspectRatio?: CSSProperties[ 'aspectRatio' ];
		minHeight?: CSSProperties[ 'minHeight' ];
	};
	spacing?: {
		margin?: CSSProperties[ 'margin' ] | Box< 'margin' >;
		padding?: CSSProperties[ 'padding' ] | Box< 'padding' >;
	};
	typography?: {
		fontSize?: CSSProperties[ 'fontSize' ];
		fontFamily?: CSSProperties[ 'fontFamily' ];
		fontWeight?: CSSProperties[ 'fontWeight' ];
		fontStyle?: CSSProperties[ 'fontStyle' ];
		letterSpacing?: CSSProperties[ 'letterSpacing' ];
		lineHeight?: CSSProperties[ 'lineHeight' ];
		textColumns?: CSSProperties[ 'columnCount' ];
		textDecoration?: CSSProperties[ 'textDecoration' ];
		textTransform?: CSSProperties[ 'textTransform' ];
		writingMode?: CSSProperties[ 'writingMode' ];
	};
	color?: {
		text?: CSSProperties[ 'color' ];
		background?: CSSProperties[ 'backgroundColor' ];
		gradient?: CSSProperties[ 'background' ];
	};
	elements?: {
		link?: {
			color?: {
				text?: CSSProperties[ 'color' ];
			};
		};
	};
}

export interface CssRulesKeys {
	default: string;
	individual: string;
}

export interface StyleOptions {
	/**
	 * CSS selector for the generated style.
	 */
	selector?: string;
}

export interface GeneratedCSSRule {
	selector?: string;
	value: string | unknown;
	/**
	 * The CSS key in JS style attribute format, compatible with React.
	 * E.g. `paddingTop` instead of `padding-top`.
	 */
	key: string;
}

export interface GenerateFunction {
	( style: Style, options: StyleOptions ): GeneratedCSSRule[];
}

export interface StyleDefinition {
	name: string;
	generate?: GenerateFunction;
}

// =============================================================================
// GLOBAL STYLES ENGINE TYPES (from @wordpress/global-styles-engine)
// =============================================================================

// =============================================================================
// CORE PRIMITIVE TYPES
// =============================================================================

/**
 * Value that can be resolved from various sources (direct value, reference, or URL)
 */
export type UnresolvedValue =
	| string
	| number
	| { ref: string }
	| { url: string }
	| undefined
	| null;

/**
 * Origin of a preset (theme, user customizations, or WordPress defaults)
 */
export type PresetOrigin = 'theme' | 'custom' | 'default';

/**
 * Common properties for all preset types
 */
export interface BasePreset {
	name: string;
	slug: string;
}

// =============================================================================
// COLOR SYSTEM TYPES
// =============================================================================

/**
 * Color preset definition
 */
export interface Color extends BasePreset {
	color: string;
}

/**
 * Gradient preset definition
 */
export interface Gradient extends BasePreset {
	gradient: string;
}

/**
 * Duotone filter preset definition
 */
export interface Duotone extends BasePreset {
	colors: string[];
}

/**
 * Palette collection for a specific origin (theme, custom, default)
 */
export interface Palette {
	name: string;
	slug: PresetOrigin;
	colors?: Color[];
	gradients?: Gradient[];
	duotones?: Duotone[];
}

/**
 * Multi-origin palette structure used by StyleBook
 */
export interface MultiOriginPalettes {
	colors?: Palette[];
	gradients?: Palette[];
	duotones?: Palette[];
	disableCustomColors?: boolean;
	disableCustomGradients?: boolean;
	hasColorsOrGradients?: boolean;
}

/**
 * Background style properties
 */
export interface BackgroundStyle {
	backgroundColor?: UnresolvedValue;
	backgroundImage?:
		| {
				url: string;
				id?: number;
		  }
		| UnresolvedValue;
	backgroundSize?: UnresolvedValue;
	backgroundPosition?: UnresolvedValue;
	backgroundRepeat?: UnresolvedValue;
	backgroundAttachment?: UnresolvedValue;
	backgroundBlendMode?: UnresolvedValue;
	backgroundOpacity?: UnresolvedValue;
}

// =============================================================================
// TYPOGRAPHY SYSTEM TYPES
// =============================================================================

/**
 * Fluid typography settings for responsive font sizes
 */
export interface FluidTypographyConfig {
	min?: string;
	max?: string;
}

/**
 * Typography preset (font size) definition
 */
export interface TypographyPreset extends BasePreset {
	size: string | number | null;
	previewFontSize?: string;
	fluid?: boolean | FluidTypographyConfig;
}

/**
 * Font size preset definition (alias for TypographyPreset for clarity)
 */
export interface FontSizePreset extends TypographyPreset {}

/**
 * Convenience type alias for font size data
 */
export type FontSize = FontSizePreset;

/**
 * Font face definition as found in theme.json
 */
export interface FontFace {
	fontFamily: string;
	fontWeight?: string | number;
	fontStyle?: string;
	fontStretch?: string;
	fontDisplay?: string;
	src?: string | string[];
}

/**
 * Font family preset definition as found in theme.json
 */
export interface FontFamilyPreset extends BasePreset {
	fontFamily: string;
	fontFace?: FontFace[];
}

/**
 * Global fluid typography settings
 */
export interface FluidTypographySettings {
	maxViewportWidth?: string;
	minFontSize?: string;
	minViewportWidth?: string;
}

/**
 * Typography settings collection
 */
export interface TypographySettings {
	fluid?: boolean | FluidTypographySettings;
	fontSizes?: TypographyPreset[] | Record< string, TypographyPreset[] >;
	fontFamilies?: Record< string, FontFamilyPreset[] >;
	defaultFontSizes?: boolean;
}

// =============================================================================
// LAYOUT SYSTEM TYPES
// =============================================================================

/**
 * Layout constraint settings
 */
export interface LayoutSettings {
	wideSize?: string;
	contentSize?: string;
}

/**
 * Spacing settings
 */
export interface SpacingSettings {
	padding?: string | Record< string, string >;
	margin?: string | Record< string, string >;
	blockGap?: string;
}

// =============================================================================
// BLOCK SYSTEM TYPES (need to move to the blocks package eventually)
// =============================================================================

/**
 * Block type definition with global styles support
 */
export interface BlockType {
	name: string;
	title: string;
	category: string;
	example?: any;
	attributes?: Record< string, unknown >;
	supports?: {
		__experimentalSelector?: string;
		inserter?: boolean;
		spacing?:
			| boolean
			| {
					blockGap?:
						| boolean
						| string[]
						| {
								__experimentalDefault?: string;
								sides: string[];
						  };
			  };
		[ key: string ]: unknown;
	};
	selectors?: Record< string, string | Record< string, string > >;
}

/**
 * Block style variation
 */
export interface BlockStyleVariation {
	name: string;
	label: string;
	styles?: Record< string, any >;
}

// =============================================================================
// GLOBAL STYLES STRUCTURE TYPES
// =============================================================================

/**
 * Global styles settings node
 */
export interface GlobalStylesSettings {
	useRootPaddingAwareAlignments?: boolean;
	typography?: TypographySettings;
	layout?: LayoutSettings;
	spacing?: SpacingSettings;
	color?: {
		palette?:
			| Color[]
			| {
					theme?: Color[];
					custom?: Color[];
					default?: Color[];
			  };
		gradients?: {
			theme?: Gradient[];
			custom?: Gradient[];
			default?: Gradient[];
		};
		duotone?: {
			theme?: Duotone[];
			custom?: Duotone[];
			default?: Duotone[];
		};
		link?: boolean;
		custom?: boolean;
		customGradient?: boolean;
		customDuotone?: boolean;
		defaultPalette?: boolean;
		defaultGradients?: boolean;
		defaultDuotone?: boolean;
	};
	custom?: Record<
		string,
		string | number | Record< string, string | number >
	>;
	blocks?: Record< string, Omit< GlobalStylesSettings, 'blocks' > >;
}

/**
 * Global styles values node
 */
export interface GlobalStylesStyles {
	color?: {
		background?: UnresolvedValue;
		text?: UnresolvedValue;
	};
	typography?: {
		fontFamily?: UnresolvedValue;
		fontSize?: UnresolvedValue;
		fontWeight?: UnresolvedValue;
		lineHeight?: UnresolvedValue;
		letterSpacing?: UnresolvedValue;
		textTransform?: UnresolvedValue;
	};
	spacing?: {
		padding?: UnresolvedValue | Record< string, UnresolvedValue >;
		margin?: UnresolvedValue | Record< string, UnresolvedValue >;
		blockGap?: string;
	};
	background?: BackgroundStyle;
	border?: {
		color?: UnresolvedValue;
		width?: UnresolvedValue;
		style?: UnresolvedValue;
		radius?:
			| UnresolvedValue
			| {
					topLeft?: UnresolvedValue;
					topRight?: UnresolvedValue;
					bottomRight?: UnresolvedValue;
					bottomLeft?: UnresolvedValue;
			  };
		top?: {
			color?: UnresolvedValue;
			width?: UnresolvedValue;
			style?: UnresolvedValue;
		};
		right?: {
			color?: UnresolvedValue;
			width?: UnresolvedValue;
			style?: UnresolvedValue;
		};
		bottom?: {
			color?: UnresolvedValue;
			width?: UnresolvedValue;
			style?: UnresolvedValue;
		};
		left?: {
			color?: UnresolvedValue;
			width?: UnresolvedValue;
			style?: UnresolvedValue;
		};
	};
	filter?: {
		duotone?: UnresolvedValue;
		opacity?: UnresolvedValue;
	};
	dimensions?: {
		width?: UnresolvedValue;
		height?: UnresolvedValue;
		minWidth?: UnresolvedValue;
		minHeight?: UnresolvedValue;
		maxWidth?: UnresolvedValue;
		maxHeight?: UnresolvedValue;
	};
	elements?: Record<
		string,
		Omit< GlobalStylesStyles, 'blocks' | 'elements' | 'variations' > & {
			':hover'?: Omit<
				GlobalStylesStyles,
				'blocks' | 'elements' | 'variations'
			>;
		}
	>;
	blocks?: Record< string, Omit< GlobalStylesStyles, 'blocks' > >;
	variations?: Record< string, Omit< GlobalStylesStyles, 'blocks' > >;
	css?: string;
}

/**
 * Complete global styles configuration
 */
export interface GlobalStylesConfig {
	version?: number;
	settings?: GlobalStylesSettings;
	styles?: GlobalStylesStyles;
	_links?: {
		[ 'wp:theme-file' ]?: ThemeFileLink[];
		[ 'wp:action-edit-css' ]?: Array< { href: string } >;
	};
}

/**
 * Style variation (extends GlobalStylesConfig with metadata)
 */
export interface StyleVariation extends GlobalStylesConfig {
	title?: string;
	description?: string;
}

/**
 * WordPress theme file link
 */
export interface ThemeFileLink {
	name: string;
	href: string;
	target?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Deep partial type for global styles merging
 */
export type DeepPartial< T > = {
	[ P in keyof T ]?: T[ P ] extends object ? DeepPartial< T[ P ] > : T[ P ];
};

/**
 * CSS selector string
 */
export type CSSSelector = string;

/**
 * CSS property value
 */
export type CSSValue = string | number | undefined;

/**
 * CSS rules object
 */
export type CSSRules = Record< string, CSSValue >;
