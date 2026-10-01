import { getBlockDefaultClassName } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';

export type SourceMap = Record< string, { layer: string } >;

export interface StyleSetting {
	label: string;
	// Global Styles paths the setting writes.
	paths: string[];
	// Attributes that hold a preset slug instead of a `style` value.
	presets?: string[];
	// CSS properties the setting writes, to spot custom CSS that sets them.
	css: string[];
	// Whether the CSS property passes down from a parent block.
	inherits?: boolean;
}

export type BlockAttributes = Record< string, any >;

/**
 * The style settings a block can set on itself, in the order the inspector
 * shows them.
 *
 * @return Settings with their Global Styles paths and CSS properties.
 */
export function getStyleSettings(): StyleSetting[] {
	return [
		{
			label: __( 'Font' ),
			paths: [ 'typography.fontFamily' ],
			presets: [ 'fontFamily' ],
			css: [ 'font-family' ],
			inherits: true,
		},
		{
			label: __( 'Size' ),
			paths: [ 'typography.fontSize' ],
			presets: [ 'fontSize' ],
			css: [ 'font-size' ],
			inherits: true,
		},
		{
			label: __( 'Appearance' ),
			paths: [ 'typography.fontStyle', 'typography.fontWeight' ],
			css: [ 'font-style', 'font-weight' ],
			inherits: true,
		},
		{
			label: __( 'Line height' ),
			paths: [ 'typography.lineHeight' ],
			css: [ 'line-height' ],
			inherits: true,
		},
		{
			label: __( 'Letter spacing' ),
			paths: [ 'typography.letterSpacing' ],
			css: [ 'letter-spacing' ],
			inherits: true,
		},
		{
			label: __( 'Decoration' ),
			paths: [ 'typography.textDecoration' ],
			css: [ 'text-decoration' ],
		},
		{
			label: __( 'Letter case' ),
			paths: [ 'typography.textTransform' ],
			css: [ 'text-transform' ],
			inherits: true,
		},
		{
			label: __( 'Text color' ),
			paths: [ 'color.text' ],
			presets: [ 'textColor' ],
			css: [ 'color' ],
			inherits: true,
		},
		{
			label: __( 'Background color' ),
			paths: [ 'color.background', 'color.gradient' ],
			presets: [ 'backgroundColor', 'gradient' ],
			css: [ 'background-color', 'background' ],
		},
		{
			label: __( 'Link color' ),
			paths: [ 'elements.link.color' ],
			css: [],
			inherits: true,
		},
		{
			label: __( 'Background image' ),
			paths: [ 'background' ],
			css: [ 'background-image' ],
		},
		{
			label: __( 'Padding' ),
			paths: [ 'spacing.padding' ],
			css: [ 'padding' ],
		},
		{
			label: __( 'Margin' ),
			paths: [ 'spacing.margin' ],
			css: [ 'margin' ],
		},
		{
			label: __( 'Block spacing' ),
			paths: [ 'spacing.blockGap' ],
			css: [ 'gap' ],
		},
		{
			label: __( 'Minimum height' ),
			paths: [ 'dimensions.minHeight' ],
			css: [ 'min-height' ],
		},
		{
			label: __( 'Border' ),
			paths: [ 'border.color', 'border.width', 'border.style' ],
			presets: [ 'borderColor' ],
			css: [ 'border', 'border-color', 'border-width', 'border-style' ],
		},
		{
			label: __( 'Radius' ),
			paths: [ 'border.radius' ],
			css: [ 'border-radius' ],
		},
		{ label: __( 'Shadow' ), paths: [ 'shadow' ], css: [ 'box-shadow' ] },
	];
}

// Layers from lowest to highest precedence, matching `resolveStyle`.
const LAYER_ORDER = [ 'root', 'element', 'block', 'blockVariation' ];

function getAt( tree: unknown, segments: string[] ): unknown {
	return segments.reduce< unknown >(
		( node, key ) =>
			node && typeof node === 'object'
				? ( node as Record< string, unknown > )[ key ]
				: undefined,
		tree
	);
}

function hasValue( value: unknown ): boolean {
	if ( value === undefined || value === null || value === '' ) {
		return false;
	}
	if ( typeof value === 'object' ) {
		return Object.values( value ).some( hasValue );
	}
	return true;
}

/**
 * Whether a block sets a setting itself, through a preset attribute or its
 * `style` attribute.
 *
 * @param attributes Block attributes.
 * @param setting    Entry from `getStyleSettings`.
 * @return Whether the block sets it.
 */
export function isSetOnBlock(
	attributes: BlockAttributes | undefined,
	setting: StyleSetting
): boolean {
	if ( setting.presets?.some( ( key ) => attributes?.[ key ] ) ) {
		return true;
	}
	return setting.paths.some( ( path ) =>
		hasValue( getAt( attributes?.style, path.split( '.' ) ) )
	);
}

/**
 * The highest-precedence Global Styles layer that sets any of the paths. A
 * path also matches the leaves under it (`spacing.padding` matches
 * `spacing.padding.top`).
 *
 * @param sources Source map from `resolveStyle`.
 * @param paths   Global Styles paths.
 * @return Layer name, or `undefined` when Styles sets none of the paths.
 */
export function getStylesLayer(
	sources: SourceMap | undefined,
	paths: string[]
): string | undefined {
	let layerIndex = -1;
	for ( const [ key, { layer } ] of Object.entries( sources ?? {} ) ) {
		if (
			paths.some(
				( path ) => key === path || key.startsWith( path + '.' )
			)
		) {
			layerIndex = Math.max( layerIndex, LAYER_ORDER.indexOf( layer ) );
		}
	}
	return LAYER_ORDER[ layerIndex ];
}

/**
 * Whether the site's own Styles changes, rather than the theme, set the value
 * a layer supplies.
 *
 * @param userStyles    The site's Styles changes.
 * @param layer         Layer that supplies the value.
 * @param paths         Global Styles paths.
 * @param blockName     Block name.
 * @param variationName Applied block style, if any.
 * @param elements      Element layers that paint the block.
 * @return Whether the site's Styles set it.
 */
export function isFromUserStyles(
	userStyles: unknown,
	layer: string,
	paths: string[],
	blockName: string,
	variationName?: string | null,
	elements: string[] = []
): boolean {
	const prefixes: string[][] = [];
	if ( layer === 'blockVariation' ) {
		prefixes.push( [
			'blocks',
			blockName,
			'variations',
			variationName ?? '',
		] );
	} else if ( layer === 'block' ) {
		prefixes.push( [ 'blocks', blockName ] );
	} else if ( layer === 'element' ) {
		elements.forEach( ( element ) =>
			prefixes.push( [ 'elements', element ] )
		);
	} else {
		prefixes.push( [] );
	}
	return prefixes.some( ( prefix ) =>
		paths.some( ( path ) =>
			hasValue( getAt( userStyles, [ ...prefix, ...path.split( '.' ) ] ) )
		)
	);
}

// A property also matches its side longhands (`padding` matches
// `padding-top`, `border` matches `border-top-color`), but not other
// properties that start or end the same way (`border` does not match
// `border-radius`, `color` does not match `background-color`).
function declares( declarations: string, properties: string[] ): boolean {
	return properties.some( ( property ) =>
		new RegExp(
			'(^|[\\s;{])' +
				property +
				'(-(top|right|bottom|left|block|inline)[a-z-]*)?\\s*:',
			'i'
		).test( declarations )
	);
}

/**
 * Whether CSS declarations set one of the properties. A text match.
 *
 * @param css        Declarations, such as a block's Additional CSS.
 * @param properties CSS properties.
 * @return Whether the CSS sets one of them.
 */
export function cssSetsProperty( css: unknown, properties: string[] ): boolean {
	return (
		typeof css === 'string' &&
		!! properties.length &&
		declares( css, properties )
	);
}

/**
 * Whether a stylesheet has a rule that names the block's class and sets one of
 * the properties. A text match, so it misses selectors that reach the block
 * another way (`h2`, `:is(...)`).
 *
 * @param css        Stylesheet, such as the site's Additional CSS.
 * @param properties CSS properties.
 * @param blockName  Block name.
 * @return Whether a rule for the block sets one of them.
 */
export function stylesheetSetsProperty(
	css: unknown,
	properties: string[],
	blockName: string
): boolean {
	if ( typeof css !== 'string' || ! properties.length ) {
		return false;
	}
	const escaped = getBlockDefaultClassName( blockName ).replace(
		/[.*+?^${}()|[\]\\]/g,
		'\\$&'
	);
	const targetsBlock = new RegExp( '\\.' + escaped + '(?![a-zA-Z0-9-])' );
	return [ ...css.matchAll( /([^{}]+)\{([^{}]*)\}/g ) ].some(
		( [ , selector, declarations ] ) =>
			targetsBlock.test( selector ) &&
			declares( declarations, properties )
	);
}

/**
 * Where a value comes from, apart from the block's own setting.
 */
export type Origin =
	| {
			type: 'styles';
			layer: string;
			fromUser: boolean;
	  }
	| {
			type: 'parent';
			parentName: string;
			// The parent sets it itself, or gets it from Styles for its block type.
			via: 'block' | 'theme' | 'user';
	  };

export interface Names {
	blockTitle: string;
	variationLabel?: string;
	element?: string;
	getTitle: ( blockName: string ) => string;
}

function forBlocks( title: string, fromUser: boolean ): string {
	return fromUser
		? sprintf(
				/* translators: %s: Block title, e.g. "Pullquote". */
				__( 'the site’s Styles for %s blocks' ),
				title
			)
		: sprintf(
				/* translators: %s: Block title, e.g. "Pullquote". */
				__( 'the theme’s styles for %s blocks' ),
				title
			);
}

/**
 * Names an origin, to complete "Overrides …" or "From …".
 *
 * @param origin Where the value comes from.
 * @param names  Names of the block, its style and its element.
 * @return The origin as a phrase, e.g. "the theme’s styles for Pullquote blocks".
 */
export function getOriginPhrase( origin: Origin, names: Names ): string {
	if ( origin.type === 'parent' ) {
		const parentTitle = names.getTitle( origin.parentName );
		if ( origin.via === 'block' ) {
			return sprintf(
				/* translators: %s: Parent block title, e.g. "Group". */
				__( 'the %s block it is inside' ),
				parentTitle
			);
		}
		return sprintf(
			/* translators: 1: Parent block title, e.g. "Group". 2: Where the parent gets it, e.g. "the theme’s styles for Group blocks". */
			__( 'the %1$s block it is inside, which gets it from %2$s' ),
			parentTitle,
			forBlocks( parentTitle, origin.via === 'user' )
		);
	}
	const { layer, fromUser } = origin;
	if ( layer === 'blockVariation' ) {
		return fromUser
			? sprintf(
					/* translators: %s: Block style name, e.g. "Outline". */
					__( 'the %s style in the site’s Styles' ),
					names.variationLabel ?? ''
				)
			: sprintf(
					/* translators: %s: Block style name, e.g. "Outline". */
					__( 'the theme’s %s style' ),
					names.variationLabel ?? ''
				);
	}
	if ( layer === 'block' ) {
		return forBlocks( names.blockTitle, fromUser );
	}
	if ( layer === 'element' ) {
		const element = ( names.element ?? '' ).replace( /^h\d$/, 'heading' );
		const elementNames: Record< string, string > = {
			button: __( 'buttons' ),
			link: __( 'links' ),
			heading: __( 'headings' ),
		};
		const elementName = elementNames[ element ] ?? element;
		return fromUser
			? sprintf(
					/* translators: %s: Element name, e.g. "buttons" or "headings". */
					__( 'the site’s Styles for %s' ),
					elementName
				)
			: sprintf(
					/* translators: %s: Element name, e.g. "buttons" or "headings". */
					__( 'the theme’s styles for %s' ),
					elementName
				);
	}
	return fromUser ? __( 'the site’s Styles' ) : __( 'the theme' );
}

/**
 * Notes for custom CSS that also sets a setting's properties, most specific
 * first: the block's own Additional CSS, the Additional CSS for the block type
 * in Styles, and the site's Additional CSS when a rule names the block.
 *
 * @param setting        Entry from `getStyleSettings`.
 * @param blockName      Block name.
 * @param blockTitle     Block title.
 * @param blockCSS       The block's own Additional CSS.
 * @param styles         Merged Global Styles.
 * @param hasOtherSource Whether the block or Styles also set it, so the notes
 *                       say "also".
 * @return Notes, one per CSS source.
 */
export function getCSSNotes(
	setting: StyleSetting,
	blockName: string,
	blockTitle: string,
	blockCSS: unknown,
	styles: any,
	hasOtherSource = true
): string[] {
	const notes = [];
	if ( cssSetsProperty( blockCSS, setting.css ) ) {
		notes.push(
			hasOtherSource
				? __( 'This block’s Additional CSS also sets it.' )
				: __( 'Set by this block’s Additional CSS.' )
		);
	}
	if ( cssSetsProperty( styles?.blocks?.[ blockName ]?.css, setting.css ) ) {
		notes.push(
			hasOtherSource
				? sprintf(
						/* translators: %s: Block title, e.g. "Pullquote". */
						__(
							'Additional CSS for %s blocks in Styles also sets it.'
						),
						blockTitle
					)
				: sprintf(
						/* translators: %s: Block title, e.g. "Pullquote". */
						__( 'Set by Additional CSS for %s blocks in Styles.' ),
						blockTitle
					)
		);
	}
	if ( stylesheetSetsProperty( styles?.css, setting.css, blockName ) ) {
		notes.push(
			hasOtherSource
				? __( 'The site’s Additional CSS also sets it.' )
				: __( 'Set by the site’s Additional CSS.' )
		);
	}
	return notes;
}
