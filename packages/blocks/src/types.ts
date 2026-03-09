/**
 * Internal dependencies
 */
import type { ComponentType, ReactElement } from 'react';

/**
 * An icon type definition. One of a Dashicon slug, an element,
 * or a component.
 *
 * @see https://developer.wordpress.org/resource/dashicons/
 */
export type Icon = string | ReactElement | ComponentType;

/**
 * Render behavior of a block type icon; one of a Dashicon slug, an element,
 * or a component.
 */
export type BlockTypeIconRender = Icon;

/**
 * An object describing a normalized block type icon.
 */
export interface BlockTypeIconDescriptor {
	/**
	 * Render behavior of the icon,
	 * one of a Dashicon slug, an element, or a component.
	 */
	src: BlockTypeIconRender;
	/**
	 * Optimal background hex string color when displaying icon.
	 */
	background?: string;
	/**
	 * Optimal foreground hex string color when displaying icon.
	 */
	foreground?: string;
	/**
	 * Optimal shadow hex string color when displaying icon.
	 */
	shadowColor?: string;
}

/**
 * Value to use to render the icon for a block type in an editor interface,
 * either a Dashicon slug, an element, a component, or an object describing
 * the icon.
 */
export type BlockTypeIcon = BlockTypeIconDescriptor | BlockTypeIconRender;

/**
 * Named block variation scopes.
 */
export type BlockVariationScope = 'block' | 'inserter' | 'transform';

/**
 * An object describing a variation defined for the block type.
 */
export interface BlockVariation<
	Attributes extends Record< string, unknown > = Record< string, unknown >,
> {
	/**
	 * The unique and machine-readable name.
	 */
	name: string;
	/**
	 * A human-readable variation title.
	 */
	title: string;
	/**
	 * A detailed variation description.
	 */
	description?: string;
	/**
	 * Block type category classification,
	 * used in search interfaces to arrange
	 * block types by category.
	 */
	category?: string;
	/**
	 * An icon helping to visualize the variation.
	 */
	icon?: Icon;
	/**
	 * Indicates whether the current variation is
	 * the default one. Defaults to `false`.
	 */
	isDefault?: boolean;
	/**
	 * Values which override block attributes.
	 */
	attributes?: Attributes;
	/**
	 * Initial configuration of nested blocks.
	 */
	innerBlocks?: Array< unknown[] >;
	/**
	 * Example provides structured data for
	 * the block preview. You can set to
	 * `undefined` to disable the preview shown
	 * for the block type.
	 */
	example?: Record< string, unknown >;
	/**
	 * The list of scopes where the variation
	 * is applicable. When not provided, it
	 * assumes all available scopes.
	 */
	scope?: BlockVariationScope[];
	/**
	 * An array of terms (which can be translated)
	 * that help users discover the variation
	 * while searching.
	 */
	keywords?: string[];
	/**
	 * This can be a function or an array of block attributes.
	 * Function that accepts a block's attributes and the
	 * variation's attributes and determines if a variation is active.
	 * We can also use a `string[]` to tell which attributes
	 * should be compared as a shorthand.
	 */
	isActive?:
		| ( (
				blockAttributes: Attributes,
				variationAttributes: Attributes
		  ) => boolean )
		| string[];
	/**
	 * The source of the variation, added internally.
	 */
	source?: string;
}

/**
 * Block attribute definition.
 */
export interface BlockAttribute {
	type?: string;
	source?: string;
	selector?: string;
	attribute?: string;
	default?: unknown;
	role?: string;
	__experimentalRole?: string;
	query?: Record< string, BlockAttribute >;
	enum?: unknown[];
	multiline?: string;
	__unstablePreserveWhiteSpace?: boolean;
}

/**
 * A block transform object.
 */
export interface BlockTransform<
	Attributes extends Record< string, unknown > = Record< string, unknown >,
> {
	type: 'block' | 'enter' | 'files' | 'prefix' | 'raw' | 'shortcode';
	blocks?: string[];
	priority?: number;
	isMultiBlock?: boolean;
	isMatch?: (
		attributes: Attributes | Attributes[],
		block: Block | Block[]
	) => boolean;
	transform?: ( ...args: unknown[] ) => Block | Block[];
	__experimentalConvert?: ( blocks: Block | Block[] ) => Block | Block[];
	blockName?: string;
	usingMobileTransformations?: boolean;
	supportedMobileTransforms?: string[];
}

/**
 * Internal type for the innerBlocks property inside of the example.
 *
 * @see BlockType.example
 */
export type BlockExampleInnerBlock = Partial< BlockType > &
	Pick< BlockType, 'name' | 'attributes' > & {
		innerBlocks?: BlockExampleInnerBlock[];
	};

export interface BlockType<
	Attributes extends Record< string, unknown > = Record< string, unknown >,
> {
	/**
	 * The version of the Block API used by the block.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#api-version
	 */
	apiVersion?: number;
	/**
	 * Block type attributes.
	 */
	attributes: {
		[ k in keyof Attributes ]: BlockAttribute;
	};
	/**
	 * Block type category classification,
	 * used in search interfaces to arrange
	 * block types by category.
	 */
	category: string;
	/**
	 * Deprecated versions.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/
	 */
	deprecated?: BlockDeprecation< Attributes >[];
	/**
	 * A detailed block type description.
	 */
	description?: string;
	/**
	 * Component to render in the editor.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
	 */
	edit?: ComponentType< BlockEditProps< Attributes > >;
	/**
	 * Block type editor script definition.
	 * It will only be enqueued in the context of the editor.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#editor-script
	 */
	editorScript?: string;
	/**
	 * Block type editor style definition.
	 * It will only be enqueued in the context of the editor.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#editor-style
	 */
	editorStyle?: string;
	/**
	 * Example provides structured data for the block preview.
	 * When not defined then no preview is shown.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#example
	 */
	example?: Partial< BlockType > & {
		innerBlocks?: BlockExampleInnerBlock[];
		/**
		 * The width of the preview container in pixels.
		 */
		viewportWidth?: number;
	};
	/**
	 * Block type icon.
	 */
	icon: BlockTypeIconDescriptor;
	/**
	 * Additional keywords to produce block
	 * type as result in search interfaces.
	 */
	keywords?: string[];
	/**
	 * Block type's namespaced name.
	 */
	name: string;
	/**
	 * Setting `parent` lets a block require that it is only
	 * available when nested within the specified blocks.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#parent
	 */
	parent?: string[];
	/**
	 * Setting `ancestor` lets a block require that it is only
	 * available when nested within the specified blocks.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#ancestor
	 */
	ancestor?: string[];
	/**
	 * Allowed child block types.
	 */
	allowedBlocks?: string[];
	/**
	 * Context provided for available access by descendants of
	 * blocks of this type, in the form of an object which maps
	 * a context name to one of the block's own attributes.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#provides-context
	 */
	providesContext?: Record< string, keyof Attributes >;
	/**
	 * Component to render on the frontend.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
	 */
	save: ComponentType< BlockSaveProps< Attributes > >;
	/**
	 * Block type frontend script definition.
	 * It will be enqueued both in the editor and when viewing
	 * the content on the front of the site.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#script
	 */
	script?: string;
	/**
	 * Block type frontend style definition.
	 * It will be enqueued both in the editor and when viewing
	 * the content on the front of the site.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#style
	 */
	style?: string;
	/**
	 * Block type frontend script definition.
	 * It will only be enqueued when viewing the content on
	 * the front of the site.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script
	 */
	viewScript?: string;
	/**
	 * Block type frontend module script definition.
	 * It will only be enqueued when viewing the content on
	 * the front of the site.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script-module
	 */
	viewScriptModule?: string;
	/**
	 * Block type view style definition.
	 * It will only be enqueued when viewing the content on
	 * the front of the site.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-style
	 */
	viewStyle?: string;
	/**
	 * PHP file to use when rendering the block type on the server
	 * to show on the front end.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#render
	 */
	render?: string;
	/**
	 * Block styles.
	 *
	 * @see https://wordpress.org/gutenberg/handbook/extensibility/extending-blocks/#block-style-variations
	 */
	styles?: BlockStyle[];
	/**
	 * Block supports configuration.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/
	 */
	supports?: BlockSupports;
	/**
	 * Block hooks configuration.
	 */
	blockHooks?: Record< string, string >;
	/**
	 * The gettext text domain of the plugin/block.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#text-domain
	 */
	textdomain?: string;
	/**
	 * Human-readable block type label.
	 */
	title: string;
	/**
	 * Transforms configuration.
	 */
	transforms?: {
		/**
		 * Transforms from another block type to this block type.
		 */
		from?: BlockTransform< Attributes >[];
		/**
		 * Transforms from this block type to another block type.
		 */
		to?: BlockTransform[];
		/**
		 * The transformations available for mobile devices.
		 */
		supportedMobileTransforms?: string[];
	};
	/**
	 * Array of the names of context values to inherit from
	 * an ancestor provider.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#context
	 */
	usesContext?: string[];
	/**
	 * Block selectors for styles.
	 */
	selectors?: Record< string, string | Record< string, string > >;
	/**
	 * The current version number of the block, such as 1.0 or 1.0.3.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#version
	 */
	version?: string;
	/**
	 * The list of block variations.
	 */
	variations?: BlockVariation< Attributes >[];
	/**
	 * Sets attributes on the topmost parent element of the current block.
	 */
	getEditWrapperProps?: (
		attrs: Attributes
	) => Record< string, string | number | boolean >;
	/**
	 * A function that defines how new attributes are merged with existing ones.
	 */
	merge?: (
		attributes: Attributes,
		attributesToMerge: Attributes
	) => Partial< Attributes >;
	/**
	 * Custom block label callback function.
	 */
	__experimentalLabel: (
		attributes: Attributes,
		options: { context: string }
	) => string;
}

/**
 * Block type deprecation handler.
 *
 * Defines migration of deprecated blocks to the current version.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/
 */
export interface BlockDeprecation<
	NewAttributes extends Record< string, unknown > = Record< string, unknown >,
	OldAttributes extends Record< string, unknown > = Record< string, unknown >,
> extends Pick<
		BlockType< OldAttributes >,
		'attributes' | 'save' | 'supports'
	> {
	/**
	 * A function which, given the attributes and inner blocks of the
	 * parsed block, returns true if the deprecation can handle the
	 * block migration.
	 */
	isEligible?: ( attributes: OldAttributes, innerBlocks: Block[] ) => boolean;
	/**
	 * A function which, given the old attributes and inner blocks,
	 * returns either the new attributes or a tuple of
	 * [attributes, innerBlocks] compatible with the block.
	 */
	migrate?: (
		attributes: OldAttributes,
		innerBlocks: Block[]
	) => NewAttributes | [ NewAttributes, Block[] ];
	/**
	 * The block API version.
	 */
	apiVersion?: number;
}

/**
 * A fully parsed block instance.
 */
export interface Block<
	Attributes extends Record< string, unknown > = Record< string, unknown >,
> {
	/**
	 * Unique client identifier.
	 */
	clientId: string;
	/**
	 * Block name.
	 */
	name: string;
	/**
	 * Whether the block is valid.
	 */
	isValid: boolean;
	/**
	 * Block attributes.
	 */
	attributes: Attributes;
	/**
	 * Inner blocks.
	 */
	innerBlocks: Block[];
	/**
	 * Original content of the block before validation fixes.
	 */
	originalContent?: string;
	/**
	 * Validation issues.
	 */
	validationIssues?: Array< { log: Function; args: unknown[] } >;
	/**
	 * Un-processed original copy of block if created through parser.
	 */
	__unstableBlockSource?: RawBlock;
}

/**
 * The raw structure of a block as returned by the parser.
 */
export interface RawBlock {
	/**
	 * Block name.
	 */
	blockName?: string | null;
	/**
	 * Block raw or comment attributes.
	 */
	attrs?: Record< string, unknown >;
	/**
	 * HTML content of the block.
	 */
	innerHTML: string;
	/**
	 * Content without inner blocks.
	 */
	innerContent: Array< string | null >;
	/**
	 * Inner blocks.
	 */
	innerBlocks: RawBlock[];
}

/**
 * Parser options.
 */
export interface ParseOptions {
	/**
	 * If a block is migrated from a deprecated version,
	 * skip logging the migration details.
	 */
	__unstableSkipMigrationLogs?: boolean;
	/**
	 * Whether to skip autop when processing freeform content.
	 */
	__unstableSkipAutop?: boolean;
}

/**
 * An object describing a Block Bindings source.
 */
export interface BlockBindingsSource {
	/**
	 * The unique and machine-readable name.
	 */
	name: string;
	/**
	 * Human-readable label. Optional when it is defined in the server.
	 */
	label?: string;
	/**
	 * Optional array of context needed by the source only in the editor.
	 */
	usesContext?: string[];
	/**
	 * Optional function to get the values from the source.
	 */
	getValues?: Function;
	/**
	 * Optional function to update multiple values connected to the source.
	 */
	setValues?: Function;
	/**
	 * Optional function to determine if the user can edit the value.
	 */
	canUserEditValue?: Function;
	/**
	 * Optional function that returns fields list that will be shown in the UI.
	 */
	getFieldsList?: ( args: {
		select: unknown;
		context: Record< string, unknown >;
	} ) => unknown;
}

/**
 * Block category definition.
 */
export interface BlockCategory {
	/**
	 * Unique category slug.
	 */
	slug: string;
	/**
	 * Category label, for display in user interface.
	 */
	title: string;
}

/**
 * Block collection.
 */
export interface BlockCollection {
	/**
	 * Collection title.
	 */
	title: string;
	/**
	 * Collection icon.
	 */
	icon?: Icon;
}

/**
 * Block style definition.
 */
export interface BlockStyle {
	/**
	 * Unique style name / CSS class.
	 */
	name: string;
	/**
	 * Human-readable label.
	 */
	label?: string;
	/**
	 * Whether this is the default style.
	 */
	isDefault?: boolean;
	/**
	 * Source of the style.
	 */
	source?: string;
}

/**
 * Control type used to indicate axial (column/row) block spacing controls.
 *
 * @see BlockSupports.spacing
 */
export type AxialDirection = 'horizontal' | 'vertical';

/**
 * Control type used to indicate CSS spacing for arbitrary sides.
 *
 * @see BlockSupports.spacing
 */
export type CSSDirection = 'top' | 'right' | 'bottom' | 'left';

/**
 * Control type used to indicate block's alignment.
 *
 * @see BlockSupports.align
 */
export type BlockAlignment = 'left' | 'center' | 'right' | 'wide' | 'full';

/**
 * CSS style properties related to dimensions of BlockSupports.
 *
 * @see BlockSupports.dimensions
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#dimensions
 */
export type BlockDimensions = {
	/**
	 * Enable aspect ratio control.
	 */
	aspectRatio?: boolean;
	/**
	 * Enable height control.
	 */
	height?: boolean;
	/**
	 * Enable min height control.
	 */
	minHeight?: boolean;
	/**
	 * Enable width control.
	 */
	width?: boolean;
};

/**
 * BlockSupports interface to enable CSS style properties related to position.
 *
 * @see BlockSupports.position
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#position
 */
export type BlockPosition = {
	/**
	 * Enable selecting sticky position.
	 */
	sticky: boolean;
};

/**
 * BlockSupports interface to enable some of the properties related to color.
 *
 * Enables UI color controls in the block editor.
 *
 * @see BlockSupports.color
 */
export interface ColorProps {
	/**
	 * This property adds UI controls which allow the user to apply
	 * a solid background color to a block.
	 *
	 * (default) true
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color-background
	 */
	background: boolean;

	/**
	 * This property adds UI controls which allow the user to apply
	 * a gradient background to a block.
	 *
	 * (default) false
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color-gradients
	 */
	gradients: boolean;

	/**
	 * This property adds block controls which allow the user
	 * to set link color in a block, link color is disabled by default.
	 *
	 * (default) false
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color-link
	 */
	link: boolean;

	/**
	 * This property adds block controls which allow the user
	 * to set text color in a block.
	 *
	 * (default) true
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color-text
	 */
	text: boolean;

	/**
	 * This property adds block controls which allow the user
	 * to set button color in a block.
	 *
	 * (default) false
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color-button
	 */
	button?: boolean;

	/**
	 * This property adds block controls which allow the user
	 * to set heading color in a block.
	 *
	 * (default) false
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color-heading
	 */
	heading?: boolean;

	/**
	 * Whether to enable the contrast checker for the block.
	 *
	 * (default) true
	 */
	enableContrastChecker?: boolean;

	/**
	 * This property adds UI controls which allow to apply a duotone filter
	 * to a block or part of a block.
	 *
	 * (default) undefined
	 *
	 * @deprecated Use `filter.duotone` instead.
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color-__experimentalduotone
	 */
	__experimentalDuotone?: string;
}

/**
 * BlockSupports interface to enable some typography related properties.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#typography
 */
export interface TypographyProps {
	/**
	 * This value signals that a block supports the font-size
	 * CSS style property.
	 *
	 * (default) false
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#typography-fontsize
	 */
	fontSize: boolean;

	/**
	 * This value signals that a block supports the line-height
	 * CSS style property.
	 *
	 * (default) false
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#typography-lineheight
	 */
	lineHeight: boolean;

	/**
	 * This value signals that a block supports the text-align
	 * CSS style property.
	 *
	 * (default) false
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#typography-textalign
	 */
	textAlign: boolean | Array< 'left' | 'center' | 'right' >;
}

/**
 * BlockSupports interface to enable some of the CSS style properties related to spacing.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#spacing
 */
export interface SpacingProps {
	/**
	 * Enable block gap control.
	 */
	blockGap: boolean | AxialDirection[];

	/**
	 * Enable margin control UI for all or specified element directions.
	 *
	 * (default) false
	 */
	margin: boolean | CSSDirection[];

	/**
	 * Enable padding control UI for all or specified element directions.
	 *
	 * (default) false
	 */
	padding: boolean | CSSDirection[];

	/**
	 * Whether to skip the serialization to HTML markup.
	 */
	__experimentalSkipSerialization?: true | string[];
}

/**
 * Description of BlockType support for editor features.
 *
 * @see BlockType.supports
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/
 */
export interface BlockSupports {
	[ key: string ]: unknown;

	/**
	 * This property adds block controls which allow to change block's alignment.
	 *
	 * (default) false
	 */
	align?: boolean | BlockAlignment[];

	/**
	 * Enable wide alignment (depends on `align`).
	 *
	 * (default) true
	 */
	alignWide?: boolean;

	/**
	 * Allows the block to specify which child blocks are allowed.
	 *
	 * (default) false
	 */
	allowedBlocks?: boolean;

	/**
	 * Anchors let you link directly to a specific block on a page.
	 *
	 * (default) false
	 */
	anchor?: boolean;

	/**
	 * Allows the block to specify an ARIA label.
	 *
	 * (default) false
	 */
	ariaLabel?: boolean;

	/**
	 * This value signals that a block supports background
	 * related properties.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#background
	 */
	background?: {
		/**
		 * Enable background image control.
		 *
		 * (default) false
		 */
		backgroundImage?: boolean;
		/**
		 * Enable background size control.
		 *
		 * (default) false
		 */
		backgroundSize?: boolean;
	};

	/**
	 * By default, Gutenberg adds a class with the form
	 * `.wp-block-your-block-name` to the root element of your saved markup.
	 *
	 * (default) true
	 */
	className?: boolean;

	/**
	 * This value signals that a block supports some of the properties
	 * related to color.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color
	 */
	color?: Partial< ColorProps >;

	/**
	 * Indicates the block has content that should be preserved
	 * during transforms.
	 *
	 * (default) false
	 */
	contentRole?: boolean;

	/**
	 * This property adds a field to define a custom className for the
	 * block's wrapper.
	 *
	 * (default) true
	 */
	customClassName?: boolean;

	/**
	 * This value signals that a block supports some of the CSS style
	 * properties related to dimensions.
	 *
	 * (default) null
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#dimensions
	 */
	dimensions?: BlockDimensions;

	/**
	 * This value signals that a block supports duotone/filter properties.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#filter
	 */
	filter?: {
		/**
		 * Enable duotone filter control.
		 *
		 * (default) false
		 */
		duotone?: boolean;
	};

	/**
	 * By default, Gutenberg will allow a block's markup to be edited
	 * individually. To disable this behavior, set `html` to `false`.
	 *
	 * (default) true
	 */
	html?: boolean;

	/**
	 * By default, all blocks will appear in the Gutenberg inserter.
	 * To hide a block so that it can only be inserted programmatically,
	 * set to false.
	 *
	 * (default) true
	 */
	inserter?: boolean;

	/**
	 * This value signals that a block supports the Interactivity API.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#interactivity
	 */
	interactivity?:
		| boolean
		| {
				/**
				 * Enable client-side navigation support.
				 *
				 * (default) false
				 */
				clientNavigation?: boolean;
				/**
				 * Enable interactive support.
				 *
				 * (default) false
				 */
				interactive?: boolean;
		  };

	/**
	 * This value signals that a block supports layout controls.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#layout
	 */
	layout?:
		| boolean
		| {
				/**
				 * Default layout configuration.
				 */
				default?: Record< string, unknown >;
				/**
				 * Allow switching between layout types.
				 *
				 * (default) false
				 */
				allowSwitching?: boolean;
				/**
				 * Allow editing layout settings.
				 *
				 * (default) true
				 */
				allowEditing?: boolean;
				/**
				 * Allow inheriting layout from parent.
				 *
				 * (default) true
				 */
				allowInheriting?: boolean;
				/**
				 * Allow sizing on children blocks.
				 *
				 * (default) false
				 */
				allowSizingOnChildren?: boolean;
				/**
				 * Allow vertical alignment.
				 *
				 * (default) true
				 */
				allowVerticalAlignment?: boolean;
				/**
				 * Allow justification.
				 *
				 * (default) true
				 */
				allowJustification?: boolean;
				/**
				 * Allow orientation changes.
				 *
				 * (default) true
				 */
				allowOrientation?: boolean;
				/**
				 * Allow wrapping.
				 *
				 * (default) true
				 */
				allowWrap?: boolean;
				/**
				 * Allow custom content and wide size.
				 *
				 * (default) true
				 */
				allowCustomContentAndWideSize?: boolean;
		  };

	/**
	 * Whether to show the block in the list view.
	 *
	 * (default) false
	 */
	listView?: boolean;

	/**
	 * A block may want to disable the ability to toggle the lock state.
	 *
	 * (default) true
	 */
	lock?: boolean;

	/**
	 * A non-multiple block can be inserted into each post, one time only.
	 *
	 * (default) true
	 */
	multiple?: boolean;

	/**
	 * This value signals that a block supports some of the CSS style
	 * properties related to position.
	 *
	 * (default) null
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#position
	 */
	position?: BlockPosition;

	/**
	 * Whether the block can be renamed by the user.
	 *
	 * (default) true
	 */
	renaming?: boolean;

	/**
	 * By default all blocks can be converted to a reusable block.
	 *
	 * (default) true
	 */
	reusable?: boolean;

	/**
	 * This value signals that a block supports shadow.
	 *
	 * (default) false
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#shadow
	 */
	shadow?: boolean;

	/**
	 * This value signals that a block supports some of the CSS style
	 * properties related to spacing.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#spacing
	 */
	spacing?: Partial< SpacingProps >;

	/**
	 * Whether the block supports splitting when pressing Enter.
	 *
	 * (default) false
	 */
	splitting?: boolean;

	/**
	 * This value signals that a block supports some typography
	 * related properties.
	 */
	typography?: Partial< TypographyProps >;

	/**
	 * Whether the block supports the visibility control.
	 *
	 * (default) true
	 */
	visibility?: boolean;

	/**
	 * CSS selector to use instead of the default `.wp-block-<blockname>` selector.
	 */
	__experimentalSelector?: string;
}

/**
 * Describes the `save` component props of a block type.
 */
export interface BlockSaveProps<
	Attributes extends Record< string, unknown > = Record< string, unknown >,
> {
	/**
	 * The generated class name for the block.
	 */
	className: string;
	/**
	 * The block attributes.
	 */
	attributes: Attributes;
}

/**
 * Describes the `edit` component props of a block type.
 */
export interface BlockEditProps<
	Attributes extends Record< string, unknown > = Record< string, unknown >,
> extends BlockSaveProps< Attributes > {
	/**
	 * The block's client ID.
	 */
	clientId: string;
	/**
	 * Whether the block is currently selected.
	 */
	isSelected: boolean;
	/**
	 * Function to update the block's attributes.
	 * Accepts an object of partial attributes, or an updater function
	 * that receives the previous attributes and returns partial attributes.
	 */
	setAttributes: (
		attrs:
			| Partial< Attributes >
			| ( ( prevAttrs: Attributes ) => Partial< Attributes > )
	) => void;
	/**
	 * Context values inherited from ancestor blocks.
	 */
	context: Record< string, unknown >;
}

/**
 * Configuration passed to `registerBlockType`.
 */
export type BlockConfiguration<
	Attributes extends Record< string, unknown > = Record< string, unknown >,
> = Partial< Omit< BlockType< Attributes >, 'icon' > > &
	Pick< BlockType< Attributes >, 'attributes' | 'category' | 'title' > & {
		icon?: BlockTypeIcon;
	};

/**
 * Block serialization options.
 */
export interface BlockSerializationOptions {
	/**
	 * Whether to include inner blocks content.
	 */
	isInnerBlocks?: boolean;
}
