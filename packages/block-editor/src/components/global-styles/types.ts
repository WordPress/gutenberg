import type { ComponentProps, ComponentType, ReactNode } from 'react';
import type { Dropdown, DropdownMenu } from '@wordpress/components';
import type {
	Color,
	Duotone,
	FontFamilyPreset,
	BackgroundStyle,
	FontSize,
	Gradient,
	UnresolvedValue,
} from '@wordpress/global-styles-engine';
import type { ColorGradientOptions } from '../colors-gradients/types';

declare global {
	interface Window {
		/**
		 * Whether the global styles inheritance indicator experiment is enabled.
		 */
		__experimentalGlobalStylesInheritanceUI?: boolean;
	}
}

export type ToolsPanelPopoverProps = Pick<
	NonNullable< ComponentProps< typeof Dropdown >[ 'popoverProps' ] >,
	'placement' | 'offset' | 'shift'
>;

/**
 * Presets of one kind, split by the origin that defines them.
 */
export interface PresetsPerOrigin< T > {
	custom?: T[];
	theme?: T[];
	default?: T[];
}

/**
 * The empty array that clears a preset list when the block cannot use it.
 */
export type NoPresets = never[] &
	Partial< Record< keyof PresetsPerOrigin< never >, undefined > >;

/**
 * Theme.json settings for a block or element, as the style panels read them.
 * A section or feature is `false` when the block does not support it.
 */
export interface StyleSettings {
	background?: Record< string, unknown > & {
		backgroundImage?: boolean;
		backgroundSize?: boolean;
		gradient?: boolean;
		backgroundClip?: boolean | string[];
	};
	border?: Record< string, unknown >;
	color?: Record< string, unknown > & {
		palette?: PresetsPerOrigin< Color >;
		gradients?: PresetsPerOrigin< Gradient > | NoPresets;
		custom?: boolean;
		customGradient?: boolean;
		duotone?: PresetsPerOrigin< Duotone > | NoPresets;
		customDuotone?: boolean;
		defaultDuotone?: boolean;
		text?: boolean;
		background?: boolean;
		link?: boolean;
		heading?: boolean;
		button?: boolean;
		caption?: boolean;
		defaultPalette?: boolean;
		defaultGradients?: boolean;
	};
	dimensions?: Record< string, unknown >;
	layout?: Record< string, unknown >;
	parentLayout?: unknown;
	shadow?: {
		defaultPresets?: boolean;
		presets?: PresetsPerOrigin< ShadowPreset >;
		[ setting: string ]: unknown;
	};
	spacing?: Record< string, unknown >;
	typography?: TypographyStyleSettings;
}

/**
 * Typography settings for a block or element. A control is shown when its
 * setting is truthy.
 */
export interface TypographyStyleSettings {
	fontFamilies?: Record< string, FontFamilyPreset[] >;
	fontSizes?: Record< string, FontSize[] >;
	defaultFontSizes?: boolean;
	customFontSize?: boolean;
	fontStyle?: boolean;
	fontWeight?: boolean;
	lineHeight?: boolean;
	letterSpacing?: boolean;
	textAlign?: boolean;
	textTransform?: boolean;
	textDecoration?: boolean;
	writingMode?: boolean;
	textColumns?: boolean;
	/**
	 * Which paragraphs to indent, or `false` when the control is hidden.
	 */
	textIndent?: 'subsequent' | 'all' | boolean;
	textShadow?: boolean;
	[ setting: string ]: unknown;
}

/**
 * A stored style value: a CSS value, a preset reference, or a `ref` to
 * another style.
 */
export type StyleValue = UnresolvedValue;

/**
 * A background image: a media item, or a `url()` string in theme.json.
 */
export type BackgroundImageValue =
	| {
			url?: string;
			id?: number;
			source?: string;
			title?: string;
			[ key: string ]: unknown;
	  }
	| string;

/**
 * The background styles a style panel edits.
 */
export interface PanelBackgroundStyle extends Omit<
	BackgroundStyle,
	'backgroundImage'
> {
	backgroundImage?: BackgroundImageValue;
	gradient?: StyleValue;
	backgroundClip?: StyleValue;
	[ key: string ]: unknown;
}

/**
 * The block or global styles a style panel edits, as stored.
 */
export interface PanelStyle {
	color?: Record< string, StyleValue >;
	typography?: Record< string, StyleValue >;
	background?: PanelBackgroundStyle;
	border?: Record< string, StyleValue | Record< string, StyleValue > >;
	spacing?: Record< string, StyleValue | Record< string, StyleValue > >;
	dimensions?: Record< string, StyleValue >;
	filter?: Record< string, StyleValue | string[] >;
	shadow?: StyleValue;
	elements?: Record< string, PanelStyle >;
	css?: string;
	[ state: `:${ string }` ]: PanelStyle | undefined;
	[ key: string ]: unknown;
}

/**
 * A viewport or pseudo state a style can be edited for.
 */
export interface StyleStateOption {
	/** The state, such as `@tablet` or `:hover`. */
	value: string;
	/** Human readable name of the state. */
	label: string;
}

export interface StateControlProps {
	/** Array of available viewport states. */
	viewportStates?: StyleStateOption[];
	/** Array of available pseudo states. */
	pseudoStates?: StyleStateOption[];
	/** Currently selected viewport value. */
	viewportValue?: string;
	/** Currently selected pseudo state value. */
	pseudoStateValue?: string;
	/** Callback when viewport selection changes. */
	onChangeViewport?: ( viewport: string ) => void;
	/** Callback when pseudo state selection changes. */
	onChangePseudoState?: ( pseudoState: string ) => void;
	/** Whether to show text label on the toggle. Default true. */
	showText?: boolean;
	/** Popover props for the dropdown menu. */
	popoverProps?: ComponentProps< typeof DropdownMenu >[ 'popoverProps' ];
	/** Optional menu content rendered after the state groups. */
	children?: ReactNode;
}

export interface StateControlBadgesProps {
	/** Array of available viewport states. */
	viewportStates?: StyleStateOption[];
	/** Array of available pseudo states. */
	pseudoStates?: StyleStateOption[];
	/** Currently selected viewport value. */
	viewportValue?: string;
	/** Currently selected pseudo state value. */
	pseudoStateValue?: string;
	/** Class name of the badges. */
	className?: string;
}

/**
 * Returns the styles a tools panel's reset all action leaves.
 */
export type PanelResetAllFilter = (
	value: PanelStyle | undefined
) => PanelStyle;

export interface StyleToolsPanelProps {
	/** Returns the styles reset all leaves. */
	resetAllFilter: PanelResetAllFilter;
	/** Called with the styles after reset all. */
	onChange: ( value: PanelStyle ) => void;
	/** The styles the panel edits. */
	value?: PanelStyle;
	/** ID of the panel. */
	panelId?: string | null;
	/** Label of the panel. */
	label?: string;
	/** Heading of the panel. */
	headerLabel?: string;
	children?: ReactNode;
}

export interface TypographyPanelProps {
	/** The tools panel the controls render in. */
	as?: ComponentType< StyleToolsPanelProps >;
	/** The styles the panel edits. */
	value?: PanelStyle;
	/** Called with the changed styles. */
	onChange: ( value: PanelStyle ) => void;
	/** The styles inherited from global styles. */
	inheritedValue?: PanelStyle;
	/** The default state styles, set only while another state is selected. */
	baseValue?: PanelStyle;
	/** The settings of the block or element. */
	settings?: StyleSettings;
	/** ID of the panel. */
	panelId?: string | null;
	/** Which controls are shown by default. */
	defaultControls?: Record< string, boolean | undefined >;
	/** Whether the panel edits global styles. */
	isGlobalStyles?: boolean;
	/** Whether controls show where their value is inherited from. */
	showInheritanceLabelIndicators?: boolean;
	/** Warning about the contrast of the text color. */
	contrastWarning?: ReactNode;
}

/**
 * A color or gradient picker tab of a color dropdown.
 */
export interface ColorGradientTabConfig {
	/** Key of the tab. */
	key: string;
	/** Label of the tab. */
	label: string;
	/** Whether the tab picks a gradient. */
	isGradient?: boolean;
	/** The inherited color or gradient. */
	inheritedValue?: string;
	/** Slug of the inherited preset. */
	inheritedSlug?: string;
	/** Slug of the block's own preset. */
	userSlug?: string;
	/** The block's own color or gradient. */
	userValue?: string;
	/** Sets the color or gradient, with its preset slug. */
	setValue: ( value?: string, slug?: string ) => void;
	/** Whether the tab shows the inherited value at rest. */
	isPlaceholder?: boolean;
}

export interface ColorGradientDropdownItemProps {
	/** Label of the item. */
	label: string;
	/** Whether the item has a value. */
	hasValue: () => boolean;
	/** Resets the value. */
	resetValue: () => void;
	/** Whether the item is shown by default. */
	isShownByDefault?: boolean;
	/** Colors or gradients of the indicators. */
	indicators: ( string | undefined )[];
	/** The picker tabs. */
	tabs: ColorGradientTabConfig[];
	/** Settings passed to `ColorGradientControl`. */
	colorGradientControlSettings: ColorGradientOptions;
	/** ID of the panel. */
	panelId?: string | null;
	/** Contrast warning message for the color value. */
	contrastWarning?: ReactNode;
	/** Class name of the item. */
	className?: string;
	/** Whether the item shows the inherited value at rest. */
	isPlaceholder?: boolean;
	/** Whether a value is inherited. */
	hasInheritedValue?: boolean;
	/** Whether the item shows where its value is inherited from. */
	showInheritanceLabelIndicators?: boolean;
}

/**
 * An element whose colors the color panel edits.
 */
export interface ColorPanelElement {
	name: string;
	label: string;
}

export interface ColorPanelProps {
	/** The tools panel the controls render in. */
	as?: ComponentType< StyleToolsPanelProps >;
	/** The styles the panel edits. */
	value?: PanelStyle;
	/** Called with the changed styles. */
	onChange: ( value: PanelStyle ) => void;
	/** The styles inherited from global styles. */
	inheritedValue?: PanelStyle;
	/** The settings of the block or element. */
	settings?: StyleSettings;
	/** ID of the panel. */
	panelId?: string | null;
	/** Which controls are shown by default. */
	defaultControls?: Record< string, boolean | undefined >;
	/** Label of the panel. */
	label?: string;
	children?: ReactNode;
	/** Warning about the contrast of the link color. */
	contrastWarning?: ReactNode;
	/** Elements to edit besides the built in ones. */
	additionalElements?: ColorPanelElement[];
	/** Whether controls show where their value is inherited from. */
	showInheritanceLabelIndicators?: boolean;
}

export interface BackgroundPanelProps {
	/** The tools panel the controls render in. */
	as?: ComponentType< StyleToolsPanelProps >;
	/** The styles the panel edits. */
	value?: PanelStyle;
	/** Called with the changed styles. */
	onChange: ( value: PanelStyle ) => void;
	/** The styles inherited from global styles. */
	inheritedValue?: PanelStyle;
	/** The default state styles, set only while another state is selected. */
	baseValue?: PanelStyle;
	/** The settings of the block or element. */
	settings?: StyleSettings;
	/** ID of the panel. */
	panelId?: string | null;
	/** Which controls are shown by default. */
	defaultControls?: Record< string, boolean | undefined >;
	/** The values the controls default to. */
	defaultValues?: Record< string, unknown >;
	/** Heading of the panel. */
	headerLabel?: string;
	/** Warning about the contrast of the background color. */
	contrastWarning?: ReactNode;
	/** Whether controls show where their value is inherited from. */
	showInheritanceLabelIndicators?: boolean;
}

export interface AdvancedPanelProps {
	/** The styles the panel edits. */
	value?: PanelStyle;
	/** Called with the changed styles. */
	onChange: ( value: PanelStyle ) => void;
	/** The styles inherited from global styles. */
	inheritedValue?: PanelStyle;
	/** Help text of the custom CSS field. */
	help?: ReactNode;
}

/**
 * The lightbox settings of the Image block.
 */
export interface LightboxSettings {
	enabled?: boolean;
	allowEditing?: boolean;
}

export interface ImageSettingsPanelProps {
	/** Called with the changed lightbox settings, or `undefined` to reset. */
	onChange: ( value: LightboxSettings | undefined ) => void;
	/** The settings the user set. */
	value?: { lightbox?: LightboxSettings };
	/** The settings the theme and core set. */
	inheritedValue?: { lightbox?: LightboxSettings };
	/** ID of the panel. */
	panelId?: string | null;
}

/**
 * A shadow preset from theme.json.
 */
export interface ShadowPreset {
	name: string;
	slug: string;
	shadow: string;
}

export interface ShadowPopoverContainerProps {
	/** The selected shadow. */
	shadow?: string;
	/** Called with the selected shadow, or `undefined` to clear it. */
	onShadowChange: ( shadow?: string ) => void;
	/** The settings of the block or element. */
	settings?: StyleSettings;
}

export interface ShadowPresetsProps {
	/** The presets to pick from. */
	presets: ShadowPreset[];
	/** The selected shadow. */
	activeShadow?: string;
	/** Called with the selected shadow, or `undefined` to clear it. */
	onSelect: ( shadow?: string ) => void;
}

export interface ShadowIndicatorProps {
	/** Whether the indicator clears the shadow. */
	type: 'unset' | 'preset';
	/** Name of the shadow. */
	label: string;
	/** Whether the shadow is selected. */
	isActive: boolean;
	/** Called when the indicator is clicked. */
	onSelect: () => void;
	/** The shadow. */
	shadow: string;
}

export interface ShadowPopoverProps extends ShadowPopoverContainerProps {
	/** Class name of the dropdown. */
	className?: string;
	/** Whether the block sets its own shadow. */
	hasLocalValue?: boolean;
	/** Whether the block's shadow overrides an inherited one. */
	hasLocalOverride?: boolean;
	/** Resets the shadow. */
	onReset?: () => void;
}

export interface FiltersPanelProps {
	/** The tools panel the controls render in. */
	as?: ComponentType< StyleToolsPanelProps >;
	/** The styles the panel edits. */
	value?: PanelStyle;
	/** Called with the changed styles. */
	onChange: ( value: PanelStyle ) => void;
	/** The styles inherited from global styles. */
	inheritedValue?: PanelStyle;
	/** The settings of the block or element. */
	settings: StyleSettings;
	/** ID of the panel. */
	panelId?: string | null;
	/** Which controls are shown by default. */
	defaultControls?: Record< string, boolean | undefined >;
	/** Whether controls show where their value is inherited from. */
	showInheritanceLabelIndicators?: boolean;
}
