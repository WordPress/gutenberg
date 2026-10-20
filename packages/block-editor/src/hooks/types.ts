import type { ComponentType, CSSProperties, ReactNode } from 'react';
import type {
	Block,
	BlockAttribute,
	BlockType,
	ColorProps,
} from '@wordpress/blocks';
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';
import type {
	PanelResetAllFilter,
	PanelStyle,
	StyleSettings,
	StyleToolsPanelProps,
} from '../components/global-styles/types';
import type { BlockVisibility } from '../components/block-visibility/use-block-visibility';
import type { BlockEditorThunkArgs } from '../store/types';
import type { Bindings } from '../utils/block-bindings';
import type { ChildLayout } from '../components/child-layout-control/types';
import type { Layout, LayoutBlockSupport, LayoutType } from '../layouts/types';

/**
 * The viewport and pseudo state whose styles a block's controls edit.
 */
export interface BlockStyleState {
	viewport?: string;
	pseudo?: string;
}

/**
 * A block's `style` attribute, or a part of it.
 */
export type BlockStyle = Record< string, unknown >;

/**
 * The block a reset-all filter resets.
 */
export interface ResetAllContext {
	attributes: Record< string, unknown >;
	clientId: string;
	name: string | null;
}

/**
 * A Tools Panel reset-all filter, returning the attributes to set. The block
 * support tools panel passes the block context; state-scoped filters do not.
 */
export type ResetAllFilter = (
	attributes: {
		style?: BlockStyle;
	},
	context?: ResetAllContext
) => ( Record< string, unknown > & { style?: BlockStyle } ) | undefined;

/**
 * Props a block support's controls receive: the block's identity and the
 * attributes the support reads.
 */
export interface BlockSupportEditProps {
	name: string;
	isSelected?: boolean;
	clientId: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	__unstableParentLayout?: unknown;
	[ attribute: string ]: unknown;
}

/**
 * Props the `editor.BlockEdit` filter passes to the block edit component.
 */
export interface BlockEditHookProps {
	name: string;
	attributes: Record< string, unknown >;
	isSelected?: boolean;
	clientId: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	__unstableParentLayout?: unknown;
}

/**
 * Props the `editor.BlockListBlock` filter passes to the block list block.
 */
export interface BlockListBlockHookProps {
	name: string;
	attributes: Record< string, unknown >;
	clientId: string;
	wrapperProps?: BlockWrapperProps;
}

/**
 * Props a block support adds to the block wrapper.
 */
export interface BlockWrapperProps {
	className?: string;
	style?: Record< string, unknown >;
	[ prop: string ]: unknown;
}

interface BlockSupportFeatureBase {
	hasSupport: ( nameOrType: string | BlockType ) => boolean;
	attributeKeys?: string[];
}

/**
 * A block support that renders controls for the block.
 */
export interface BlockEditFeature extends BlockSupportFeatureBase {
	edit: ComponentType< BlockSupportEditProps >;
	shareWithChildBlocks?: boolean;
	supportsPatternEditing?: boolean;
}

/**
 * The props `createBlockListBlockFilter` passes to `useBlockProps`: the block
 * name and client ID, plus the set attributes listed in `attributeKeys`.
 */
export interface BlockListBlockFeatureProps {
	name: string;
	clientId: string;
	[ attribute: string ]: unknown;
}

/**
 * A block support that adds props to the block wrapper in the editor.
 */
export interface BlockListBlockFeature extends BlockSupportFeatureBase {
	useBlockProps: (
		props: BlockListBlockFeatureProps
	) => BlockWrapperProps | undefined;
	isMatch?: ( attributes: Record< string, unknown > ) => boolean;
}

/**
 * A block support that adds props to the saved block markup.
 */
export interface BlockSaveFeature extends BlockSupportFeatureBase {
	addSaveProps: (
		props: Record< string, unknown >,
		blockType: BlockType,
		attributes: Record< string, unknown >
	) => Record< string, unknown >;
}

/**
 * A style override for the editor canvas: CSS or SVG assets, keyed by `id`.
 */
export interface StyleOverrideOptions {
	id?: string | null;
	css?: string;
	assets?: string;
	__unstableType?: string;
	variation?: unknown;
	clientId?: string;
}

/**
 * A value after `cleanEmptyObject`: plain objects lose their empty values, so
 * every key may be missing.
 */
export type CleanedObject< T > = T extends ( ...args: never[] ) => unknown
	? T
	: T extends unknown[]
		? T
		: T extends object
			? { [ K in keyof T ]?: CleanedObject< T[ K ] > }
			: T;

/**
 * A block's `color` support. Supports are read as declared, so a boolean
 * support reads like an object with no keys.
 */
export type ColorSupport = Partial< ColorProps > & { gradient?: boolean };

/**
 * A block's `__experimentalBorder` support, or `true` for all its features.
 */
export type BorderSupport = true | Record< string, unknown >;

/**
 * A block gap style: one value for both axes, or a `top` (row) and `left`
 * (column) value.
 */
export type BlockGapValue = string | { top?: string; left?: string };

/**
 * The `metadata` attribute every block gets.
 */
export interface BlockMetadata {
	name?: string;
	noteId?: unknown;
	blockVisibility?: BlockVisibility;
	[ key: string ]: unknown;
}

/**
 * A block whose `metadata` attribute is read.
 */
export type BlockWithMetadata = Block< { metadata?: BlockMetadata } >;

/**
 * The attributes the anchor support reads.
 */
export interface AnchorAttributes {
	anchor?: string;
}

/**
 * Props of the anchor control.
 */
export interface AnchorEditProps {
	anchor?: string;
	setAttributes: BlockSupportEditProps[ 'setAttributes' ];
}

/**
 * The attributes the custom class name support reads.
 */
export interface CustomClassNameAttributes {
	className?: string;
}

/**
 * Props of the custom class name control.
 */
export interface CustomClassNameEditProps {
	className?: string;
	setAttributes: BlockSupportEditProps[ 'setAttributes' ];
}

/**
 * A block's `align` support: all alignments, none, or a list of them.
 */
export type AlignSupport = boolean | string[] | undefined;

/**
 * The attributes the align support reads.
 */
export interface AlignAttributes {
	align?: string;
}

/**
 * Props of the align toolbar control.
 */
export interface AlignEditProps {
	name: string;
	align?: string;
	setAttributes: BlockSupportEditProps[ 'setAttributes' ];
}

/**
 * A block whose `className` attribute is read.
 */
export type BlockWithClassName = Block< { className?: string } >;

/**
 * A block attribute that PHP marks for an auto-generated inspector control.
 */
export interface AutoGenerateAttribute extends BlockAttribute {
	autoGenerateControl?: boolean;
	label?: string;
	items?: Pick< BlockAttribute, 'type' | 'enum' >;
}

/**
 * Props of the auto-generated inspector controls.
 */
export interface AutoRegisterControlsProps {
	name: string;
	clientId: string;
	setAttributes: BlockSupportEditProps[ 'setAttributes' ];
}

/**
 * The section editing state of a block, and the actions that change it.
 */
export interface ContentOnlySectionEdit {
	isSectionBlock: boolean;
	isWithinSection: boolean;
	isWithinEditedSection: boolean;
	isEditingContentOnlySection: boolean;
	editedContentOnlySection: string | undefined;
	editContentOnlySection: BlockEditorThunkArgs[ 'dispatch' ][ 'editContentOnlySection' ];
	stopEditingContentOnlySection: BlockEditorThunkArgs[ 'dispatch' ][ 'stopEditingContentOnlySection' ];
}

/**
 * Props of the line height block support control.
 */
export interface LineHeightEditProps {
	attributes: {
		style?: BlockStyle & {
			typography?: Record< string, unknown > & {
				lineHeight?: string | number;
			};
		};
	};
	setAttributes: ( attributes: Record< string, unknown > ) => void;
}

/**
 * Props of the margin and padding visualizers.
 */
export interface SpacingVisualizerProps {
	clientId: string;
	value?: BlockStyle & {
		spacing?: Record< string, unknown > & {
			margin?: unknown;
			padding?: unknown;
		};
	};
	forceShow?: boolean;
}

/**
 * Props of the visualizer overlaying a block's margin or padding.
 */
export interface SpacingVisualizerBaseProps {
	clientId: string;
	value: unknown;
	computeStyle: ( blockElement: Element ) => CSSProperties;
	forceShow?: boolean;
}

/**
 * The computed colors of a rendered block.
 */
export interface BlockElementColors {
	textColor?: string;
	backgroundColor?: string;
	linkColor?: string;
}

/**
 * Options of `useBlockColorContrastWarning`.
 */
export interface UseBlockColorContrastWarningOptions {
	clientId: string;
	name?: string;
	enabled?: boolean;
	checkTextColor?: boolean;
	checkLinkColor?: boolean;
	messageOverride?: string;
}

/**
 * Props of the block bindings panel.
 */
export interface BlockBindingsPanelProps {
	name: string;
	metadata?: { bindings?: Bindings };
}

/**
 * Props of the component applying one style override.
 */
export interface OverrideStylesProps {
	override: StyleOverrideOptions;
}

/**
 * Props of `BlockStyleVariationOverridesWithConfig`.
 */
export interface BlockStyleVariationOverridesWithConfigProps {
	/**
	 * A global styles object, containing settings and styles.
	 */
	config?: GlobalStylesConfig;
}

/**
 * The position of a block, as stored in its `style.position` attribute.
 */
export interface PositionStyle {
	type?: string;
	top?: string;
	right?: string;
	bottom?: string;
	left?: string;
}

/**
 * A block style that may set a position.
 */
export type PositionBlockStyle = BlockStyle & { position?: PositionStyle };

/**
 * Props of the position block support panel.
 */
export interface PositionPanelProps {
	style?: PositionBlockStyle;
	clientId: string;
	name: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
}

/**
 * The attributes the position block support reads.
 */
export interface PositionAttributes {
	style?: PositionBlockStyle;
}

/**
 * Block props carrying the position attributes.
 */
export interface PositionValueProps {
	attributes: PositionAttributes;
}

/**
 * Props of `resetPosition`.
 */
export interface ResetPositionProps {
	attributes?: PositionAttributes;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
}

/**
 * Options of `getPositionCSS`.
 */
export interface PositionCSSOptions {
	selector: string;
	style?: PositionBlockStyle;
}

/**
 * Options of `getResponsivePositionCSS`.
 */
export interface ResponsivePositionCSSOptions extends PositionCSSOptions {
	viewportSettings?: unknown;
}

/**
 * The attributes the fit text support reads.
 */
export type FitTextAttributes = {
	fitText?: boolean;
	fontSize?: string;
	style?: BlockStyle & { typography?: BlockStyle };
};

/**
 * Props of the hook sizing a block's text to fit its container.
 */
export interface UseFitTextProps {
	/**
	 * Fit text attribute.
	 */
	fitText?: boolean;
	/**
	 * Block name.
	 */
	name: string;
	/**
	 * Block client ID.
	 */
	clientId: string;
}

/**
 * Props of `FitTextControl`.
 */
export interface FitTextControlProps extends FitTextAttributes {
	/**
	 * Block client ID.
	 */
	clientId: string;
	/**
	 * Function to set block attributes.
	 */
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	/**
	 * Block name.
	 */
	name: string;
}

/**
 * Props of the component warning about a small fit text font size.
 */
export interface FitTextFontSizeProps extends UseFitTextProps {
	/**
	 * Whether the block is selected.
	 */
	isSelected?: boolean;
}

/**
 * A CSS rule of a block's child layout, optionally in an at-rule group.
 */
export interface ChildLayoutRule {
	selector: string;
	declarations: Record< string, string | number >;
	rulesGroup?: string;
}

/**
 * Options to build the CSS rules of a block's child layout.
 */
export interface ChildLayoutStyleRulesOptions {
	/** Selector of the block. */
	selector: string;
	/** The child layout of the block. */
	layout?: ChildLayout;
	/** The child layout of a viewport, applied over `layout`. */
	viewportOverrides?: ChildLayout;
	/** The layout of the parent block. */
	parentLayout?: Layout;
	/** Whether to add a container query to responsive grids. */
	includeContainerQuery?: boolean;
}

/**
 * Options to build the CSS of a block's child layout for each viewport.
 */
export interface ResponsiveChildLayoutStylesOptions {
	/** The style attribute of the block. */
	style?: ChildLayoutBlockStyle;
	/** Selector of the block. */
	selector: string;
	/** The layout of the parent block. */
	parentLayout?: Layout;
	/** The viewport settings of the editor. */
	viewportSettings?: Record< string, unknown >;
}

/**
 * A style attribute holding a child layout.
 */
export type ChildLayoutBlockStyle = BlockStyle & { layout?: ChildLayout };

export interface ChildLayoutControlsPureProps {
	clientId: string;
	style?: ChildLayoutBlockStyle;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
}

export interface GridToolsProps extends ChildLayoutControlsPureProps {
	allowSizingOnChildren: boolean;
	isManualPlacement?: boolean;
	parentLayout: Layout;
}

/**
 * The block attributes the layout support reads.
 */
export interface LayoutAttributes {
	layout?: Layout;
	style?: BlockStyle;
	className?: string;
	[ attribute: string ]: unknown;
}

/**
 * Options to decide whether the layout panel has controls to display.
 */
export interface HasLayoutPanelControlsOptions {
	/** Active layout type. */
	layoutType?: LayoutType;
	/** Constrained layout type. */
	constrainedType?: LayoutType;
	/** Layout support settings. */
	layoutBlockSupport?: LayoutBlockSupport;
	/** Whether to show the inherit toggle. */
	showInheritToggle?: boolean;
	/** Whether to show the layout type switcher. */
	showLayoutTypeSwitcher?: boolean;
	/** Whether to show legacy layout controls, as a truthy content size. */
	displayControlsForLegacyLayouts?: boolean | string | null;
}

/**
 * Options to generate the responsive layout CSS of viewport state styles.
 */
export interface ResponsiveLayoutStylesOptions {
	/** Block attributes. */
	attributes?: LayoutAttributes;
	/** Block name. */
	blockName: string;
	/** CSS selector. */
	selector: string;
	/** Active block layout. */
	layout?: Layout;
	/** Whether block gap is supported. */
	hasBlockGapSupport?: boolean;
	/** Global block gap fallback. */
	globalBlockGapValue?: BlockGapValue;
	/** Viewport breakpoint settings. */
	viewportSettings?: Record< string, unknown >;
}

export interface LayoutPanelProps extends BlockSupportEditProps {
	layout?: Layout;
	style?: BlockStyle;
}

export interface LayoutTypeSwitcherProps {
	type: string;
	onChange: ( type: string ) => void;
}

/**
 * The block gap and viewport settings the layout styles of a block use.
 */
export interface LayoutStylesSettings {
	blockGapSupport?: unknown;
	globalBlockGapValue?: BlockGapValue;
	viewportSettings?: Record< string, unknown >;
}

export interface BlockWithLayoutStylesProps extends LayoutStylesSettings {
	block: ComponentType< BlockListBlockHookProps & Record< string, unknown > >;
	props: BlockListBlockHookProps & { attributes: LayoutAttributes };
	layoutClasses: string[];
}

export interface BlockStatesControlProps {
	/** Block name. */
	name: string;
	/** Currently selected style-state value. */
	value?: BlockStyleState;
	/** Callback when style-state selection changes. */
	onChange: ( value: BlockStyleState ) => void;
	/** Optional menu content rendered after the state groups. */
	children?: ReactNode;
}

export interface BlockStateBadgesProps {
	/** Block name. */
	name: string;
	/** Currently selected style-state value. */
	value?: BlockStyleState;
	/** Whether Responsive editing is enabled. */
	isResponsiveEditing?: boolean;
}

/**
 * A block style with the text alignment set.
 */
export type TextAlignStyle = BlockStyle & {
	typography?: Record< string, unknown > & { textAlign?: string };
};

export interface TextAlignAttributes {
	style?: TextAlignStyle;
}

export interface TextAlignEditProps extends BlockSupportEditProps {
	style?: TextAlignStyle;
}

/**
 * A block style with the custom font size set.
 */
export type FontSizeStyle = BlockStyle & {
	typography?: Record< string, unknown > & { fontSize?: string | number };
};

export interface FontSizeEditProps {
	attributes: { fontSize?: string; style?: FontSizeStyle };
	setAttributes: ( attributes: Record< string, unknown > ) => void;
}

/**
 * The block attributes the typography support reads and writes.
 */
export type TypographyAttributes = {
	style?: PanelStyle;
	fontFamily?: string;
	fontSize?: string;
	fitText?: boolean;
	textColor?: string;
	textShadow?: string;
	className?: string;
	backgroundColor?: string;
	gradient?: string;
} & Record< string, unknown >;

export interface TypographyHookPanelProps {
	clientId: string;
	name: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	settings: StyleSettings;
	/** Renders the panel outside the `typography` inspector group. */
	asWrapper?: ComponentType< StyleToolsPanelProps >;
}

/**
 * Props of the inspector group a style support panel renders in.
 */
export interface StyleInspectorControlProps {
	children?: ReactNode;
	resetAllFilter: PanelResetAllFilter;
}

/**
 * The block attributes the dimensions support reads.
 */
export type DimensionsAttributes = {
	style?: PanelStyle;
	className?: string;
	layout?: Layout;
};

export interface DimensionsHookPanelProps {
	clientId: string;
	name: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	settings: StyleSettings;
}

/**
 * The block attributes the border support reads and writes.
 */
export type BorderAttributes = {
	style?: PanelStyle;
	borderColor?: string;
	className?: string;
} & Record< string, unknown >;

export interface BorderHookPanelProps {
	clientId: string;
	name: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	settings: StyleSettings;
}

/**
 * A palette color, or an unnamed custom color.
 */
export interface MultiOriginColor {
	color?: string;
	name?: string;
	slug?: string;
}

/**
 * The block attributes the background support reads and writes.
 */
export type BackgroundAttributes = {
	style?: PanelStyle;
	className?: string;
	backgroundColor?: string;
	gradient?: string;
} & Record< string, unknown >;

export interface BackgroundHookPanelProps {
	clientId: string;
	name: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	settings: StyleSettings;
	/** Renders the panel outside the `background` inspector group. */
	asWrapper?: ComponentType< StyleToolsPanelProps >;
}

/**
 * Options of `getBlockStateStylesCSS`.
 */
export interface StateStylesCSSOptions {
	/** Block name. */
	name: string;
	/** Block-instance scoping selector. */
	baseSelector: string;
	/** Optional pseudo-state, e.g. ":hover". */
	state?: string;
	/** Styles the state layers over. */
	baseStyle?: PanelStyle;
}

export interface BlockStyleControlsProps extends BlockSupportEditProps {
	style?: PanelStyle;
}

/**
 * The block attributes the elements support reads.
 */
export type ElementsAttributes = {
	style?: PanelStyle;
	className?: string;
};

export interface ElementsEditProps {
	clientId: string;
	name: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	settings: StyleSettings;
	/** Renders the panel outside the `elements` inspector group. */
	asWrapper?: ComponentType< StyleToolsPanelProps >;
	/** Label of the panel. */
	label?: string;
	/** Which controls are shown by default. */
	defaultControls?: Record< string, boolean | undefined >;
}

/**
 * The block attributes the color support reads and writes.
 */
export type ColorAttributes = {
	backgroundColor?: string;
	textColor?: string;
	gradient?: string;
	style?: PanelStyle;
} & Record< string, unknown >;

/**
 * A custom CSS string of one block style state.
 */
export interface CustomCSSStateEntry {
	css: string;
	pseudoState?: string;
	mediaQuery?: string;
}

export interface CustomCSSControlProps {
	/** Block name. */
	blockName: string;
	/** Function to set block attributes. */
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	/** Block style attribute. */
	style?: PanelStyle;
	/** Currently selected block style state. */
	selectedState?: BlockStyleState;
}

/**
 * The block attributes that hold the block styles.
 */
export type StyleAttributes = {
	style?: PanelStyle;
} & Record< string, unknown >;
