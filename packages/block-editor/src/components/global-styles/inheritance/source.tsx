import clsx from 'clsx';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { Link } from '@wordpress/ui';
import { speak } from '@wordpress/a11y';
import {
	createContext,
	createInterpolateElement,
	useContext,
	useEffect,
	useMemo,
} from '@wordpress/element';
import {
	getBlockDefaultClassName,
	getBlockType as getRegisteredBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { __, sprintf } from '@wordpress/i18n';
import { store as blockEditorStore } from '../../../store';
import {
	globalStylesDataKey,
	globalStylesUserDataKey,
	styleOriginUrlKey,
} from '../../../store/private-keys';
import { useBlockEditContext } from '../../block-edit/context';
import { unlock } from '../../../lock-unlock';

const { resolveStyle } = unlock( globalStylesEnginePrivateApis );

type SourceMap = Record< string, { layer: string } >;

interface ResolvedStyle {
	sources?: SourceMap;
	blockName?: string;
	variationName?: string | null;
	elements?: string[];
}

/**
 * The resolved Global Styles for the selected block, as returned by
 * `useResolvedStyle`: the source map plus the block, variation and element
 * layers it was resolved against. Provided by the block-supports hooks, so it
 * is only set in the block inspector, not on the Global Styles screens.
 */
export const InheritanceSourceContext = createContext< ResolvedStyle | null >(
	null
);

// Layers from lowest to highest precedence, matching `resolveStyle`.
const LAYER_ORDER = [ 'root', 'element', 'block', 'blockVariation' ];

/**
 * Finds the layer that supplies the value at a Global Styles path. Paths that
 * name a group of values (`spacing.padding`, `border`) match any leaf under
 * them, and the highest-precedence layer among those wins.
 *
 * @param sources Source map from `resolveStyle`.
 * @param paths   Path or paths the control edits.
 * @return Layer name, or `undefined` when nothing supplies a value.
 */
export function getSourceLayer(
	sources: SourceMap | undefined,
	paths: string | string[]
): string | undefined {
	if ( ! sources || ! paths ) {
		return undefined;
	}
	const prefixes = Array.isArray( paths ) ? paths : [ paths ];
	let layerIndex = -1;
	for ( const [ key, { layer } ] of Object.entries( sources ) ) {
		const matches = prefixes.some(
			( prefix ) => key === prefix || key.startsWith( prefix + '.' )
		);
		if ( matches ) {
			layerIndex = Math.max( layerIndex, LAYER_ORDER.indexOf( layer ) );
		}
	}
	return LAYER_ORDER[ layerIndex ];
}

/**
 * The Global Styles screen that defines a value, as a path for the Styles
 * navigator (the `section` of a Site Editor styles URL).
 *
 * @param layer         Layer that supplies the value.
 * @param paths         Global Styles path(s) the control edits.
 * @param blockName     Block name.
 * @param variationName Applied block style variation, if any.
 * @param elements      Element keys that paint the block, low to high.
 * @return Screen path.
 */
export function getStylesSection(
	layer: string,
	paths: string | string[],
	blockName?: string,
	variationName?: string | null,
	elements: string[] = []
): string {
	const firstPath = Array.isArray( paths ) ? paths[ 0 ] : paths;
	const group = firstPath.split( '.' )[ 0 ];
	if ( layer === 'block' && blockName ) {
		return '/blocks/' + encodeURIComponent( blockName );
	}
	if ( layer === 'blockVariation' && blockName && variationName ) {
		return (
			'/blocks/' +
			encodeURIComponent( blockName ) +
			'/variations/' +
			encodeURIComponent( variationName )
		);
	}
	if ( layer === 'element' && group === 'typography' ) {
		const element = elements[ elements.length - 1 ];
		if ( element === 'button' || element === 'link' ) {
			return '/typography/' + element;
		}
		return '/typography/heading';
	}
	// Element spacing, borders and the like have no element screen in Styles;
	// they are edited on the block's own screen.
	if (
		layer === 'element' &&
		blockName &&
		group !== 'color' &&
		group !== 'elements'
	) {
		return '/blocks/' + encodeURIComponent( blockName );
	}
	switch ( group ) {
		case 'typography':
			// Site-wide text is edited under Typography → Text.
			return '/typography/text';
		case 'color':
		case 'elements':
			return '/colors';
		case 'spacing':
		case 'dimensions':
		case 'layout':
			return '/layout';
		case 'background':
			return '/background';
		case 'shadow':
			return '/shadows';
		default:
			return '/';
	}
}

// The CSS property each Global Styles path sets, to spot custom CSS that sets
// the same property. A property also matches its longhands (`padding` matches
// `padding-top`), but not other properties that end the same way (`color`
// does not match `background-color`).
const CSS_PROPERTIES: Record< string, string[] > = {
	'typography.fontSize': [ 'font-size' ],
	'typography.fontFamily': [ 'font-family' ],
	'typography.fontStyle': [ 'font-style' ],
	'typography.fontWeight': [ 'font-weight' ],
	'typography.lineHeight': [ 'line-height' ],
	'typography.letterSpacing': [ 'letter-spacing' ],
	'typography.textIndent': [ 'text-indent' ],
	'typography.textColumns': [ 'column-count', 'columns' ],
	'typography.textDecoration': [ 'text-decoration' ],
	'typography.textTransform': [ 'text-transform' ],
	'typography.writingMode': [ 'writing-mode' ],
	'typography.textAlign': [ 'text-align' ],
	'typography.textShadow': [ 'text-shadow' ],
	'color.text': [ 'color' ],
	'color.background': [ 'background-color', 'background' ],
	'color.gradient': [ 'background-image', 'background' ],
	'background.backgroundImage': [ 'background-image', 'background' ],
	'spacing.padding': [ 'padding' ],
	'spacing.margin': [ 'margin' ],
	'spacing.blockGap': [ 'gap' ],
	'dimensions.minHeight': [ 'min-height' ],
	'dimensions.minWidth': [ 'min-width' ],
	'dimensions.height': [ 'height' ],
	'dimensions.width': [ 'width' ],
	'dimensions.aspectRatio': [ 'aspect-ratio' ],
	border: [ 'border' ],
	'border.radius': [ 'border-radius' ],
	shadow: [ 'box-shadow' ],
	'filter.duotone': [ 'filter' ],
};

/**
 * Whether CSS declarations set one of the properties a control edits. With a
 * block name, only rules whose selector names the block's class count; without
 * one, the CSS is a block's own declarations (Additional CSS has no selector).
 * A text match, so it misses selectors that reach the block another way.
 *
 * @param css       Stylesheet or declarations.
 * @param paths     Global Styles path(s) the control edits.
 * @param blockName Only count rules that name this block's class.
 * @return Whether the CSS sets one of the control's properties.
 */
export function cssSetsProperty(
	css: string | undefined,
	paths: string | string[],
	blockName?: string
): boolean {
	if ( ! css?.trim() ) {
		return false;
	}
	const properties = ( Array.isArray( paths ) ? paths : [ paths ] ).flatMap(
		( path ) => CSS_PROPERTIES[ path ] ?? []
	);
	if ( ! properties.length ) {
		return false;
	}
	const declares = ( declarations: string ) =>
		properties.some( ( property ) =>
			new RegExp(
				'(^|[\\s;{])' + property + '(-[a-z-]+)?\\s*:',
				'i'
			).test( declarations )
		);
	if ( ! blockName ) {
		return declares( css );
	}
	// Each `selector { declarations }` rule that names the block's class.
	return [ ...css.matchAll( /([^{}]+)\{([^{}]*)\}/g ) ].some(
		( [ , selector, declarations ] ) =>
			cssTargetsBlock( selector, blockName ) && declares( declarations )
	);
}

/**
 * Where a layer keeps a value in the Global Styles tree, so the site's own
 * Styles changes can be checked for it.
 *
 * @param layer         Layer that supplies the value.
 * @param path          Global Styles path the control edits.
 * @param blockName     Block name.
 * @param variationName Applied block style variation, if any.
 * @param element       Element key that paints the block, for element layers.
 * @return Path segments in the styles tree.
 */
function getTreePath(
	layer: string,
	path: string,
	blockName?: string,
	variationName?: string | null,
	element?: string
): string[] {
	const leaf = path.split( '.' );
	switch ( layer ) {
		case 'blockVariation':
			return [
				'blocks',
				blockName ?? '',
				'variations',
				variationName ?? '',
				...leaf,
			];
		case 'block':
			return [ 'blocks', blockName ?? '', ...leaf ];
		case 'element':
			return [ 'elements', element ?? '', ...leaf ];
		default:
			return leaf;
	}
}

function hasValueAt( tree: any, segments: string[] ): boolean {
	const value = segments.reduce(
		( node, key ) =>
			node && typeof node === 'object' ? node[ key ] : undefined,
		tree
	);
	if ( value === undefined || value === null || value === '' ) {
		return false;
	}
	if ( typeof value === 'object' && ! Array.isArray( value ) ) {
		return Object.keys( value ).length > 0;
	}
	return true;
}

/**
 * Names a Styles screen the way its menus read, so the line says where to
 * change a value even to someone who does not follow the link, e.g.
 * "Styles → Typography → Headings" or "Styles → Blocks → Heading".
 *
 * @param section        Styles screen path, from `getStylesSection`.
 * @param blockTitle     Block title, for block screens.
 * @param variationLabel Block style name, for block style screens.
 * @return The screen's trail of menu names.
 */
export function getStylesCrumb(
	section: string,
	blockTitle: string,
	variationLabel: string
): string {
	const trail = ( ...parts: string[] ) =>
		[ __( 'Styles' ), ...parts ].join( ' → ' );
	if ( section.startsWith( '/blocks/' ) ) {
		return section.includes( '/variations/' )
			? trail( __( 'Blocks' ), blockTitle, variationLabel )
			: trail( __( 'Blocks' ), blockTitle );
	}
	switch ( section ) {
		case '/typography/text':
			return trail( __( 'Typography' ), __( 'Text' ) );
		case '/typography/heading':
			return trail( __( 'Typography' ), __( 'Headings' ) );
		case '/typography/button':
			return trail( __( 'Typography' ), __( 'Buttons' ) );
		case '/typography/link':
			return trail( __( 'Typography' ), __( 'Links' ) );
		case '/typography':
			return trail( __( 'Typography' ) );
		case '/colors':
			return trail( __( 'Colors' ) );
		case '/layout':
			return trail( __( 'Layout' ) );
		case '/background':
			return trail( __( 'Background' ) );
		case '/shadows':
			return trail( __( 'Shadows' ) );
		case '/css':
			return trail( __( 'Additional CSS' ) );
		default:
			return trail();
	}
}

// Paths whose CSS property inherits from a parent element, so a parent block
// that sets it paints the blocks inside it. Background, spacing, borders and
// the like do not inherit.
const INHERITED_PATHS = new Set( [
	'color.text',
	'typography.fontFamily',
	'typography.fontSize',
	'typography.fontStyle',
	'typography.fontWeight',
	'typography.lineHeight',
	'typography.letterSpacing',
	'typography.textTransform',
	'typography.textAlign',
	'typography.textIndent',
	'typography.writingMode',
] );

/**
 * A block's own value for a path: a preset attribute (`textColor`,
 * `fontSize`, `fontFamily`) or the `style` attribute.
 *
 * @param attributes Block attributes.
 * @param path       Global Styles path.
 * @return The value, or `undefined` when the block does not set it.
 */
function getOwnValue( attributes: any, path: string ): unknown {
	const presets: Record< string, string > = {
		'color.text': 'textColor',
		'typography.fontSize': 'fontSize',
		'typography.fontFamily': 'fontFamily',
	};
	const preset = presets[ path ];
	if ( preset && attributes?.[ preset ] ) {
		return attributes[ preset ];
	}
	const value = path
		.split( '.' )
		.reduce(
			( node: any, key ) =>
				node && typeof node === 'object' ? node[ key ] : undefined,
			attributes?.style
		);
	return value === '' || value === null ? undefined : value;
}

const EMPTY_ARRAY: never[] = [];

interface InheritanceSourceHelpProps {
	/** Global Styles path(s) the control edits. */
	path: string | string[];
	/** Control is showing an inherited value. */
	isInherited?: boolean;
	/** Control holds a value set on the block itself. */
	hasLocalValue?: boolean;
	/** Rendered inside the control's picker popover rather than under it. */
	isInPopover?: boolean;
	/** Element id, so the control can use the line as its description. */
	id?: string;
	/** The value was just reset to the inherited one: show and announce it. */
	isJustReset?: boolean;
	/** Only the control's accessible description; never shown. */
	isDescriptionOnly?: boolean;
}

/**
 * Names where a control's value comes from, in a line under the control:
 * the theme or the site's Styles (for an inherited value, linked to the Styles
 * screen that defines it), the block itself, or nothing. It also names custom
 * CSS that sets the same property: the block's own Additional CSS, the CSS for
 * the block type in Styles, or site-wide custom CSS that targets the block.
 *
 * The line is hidden until someone asks for it with the style origins toggle
 * in the panel header, and also shows after a reset, to name the value the
 * control fell back to. Color controls render it inside their picker popover
 * instead, under the palette.
 *
 * @param props                   Component props.
 * @param props.path              Global Styles path(s) the control edits.
 * @param props.isInherited       Control is showing an inherited value.
 * @param props.hasLocalValue     Control holds a value set on the block.
 * @param props.isInPopover       Rendered inside the control's picker popover.
 * @param props.id                Element id, used as the control's description.
 * @param props.isJustReset       The value was just reset: show and announce it.
 * @param props.isDescriptionOnly Only the control's description; never shown.
 * @return The help line, or `null` outside the block inspector.
 */
export function InheritanceSourceHelp( {
	path,
	isInherited,
	hasLocalValue,
	isInPopover,
	id,
	isJustReset,
	isDescriptionOnly,
}: InheritanceSourceHelpProps ) {
	const resolved = useContext( InheritanceSourceContext );
	const { clientId } = useBlockEditContext();
	const layer = getSourceLayer( resolved?.sources, path );
	const blockName = resolved?.blockName;
	const variationName = resolved?.variationName;
	const {
		blockTitle,
		variationLabel,
		getStyleOriginUrl,
		userStyles,
		mergedStyles,
		blockCSS,
	} = useSelect(
		( select ) => {
			const settings = select( blockEditorStore ).getSettings() as Record<
				symbol,
				any
			>;
			const { getBlockType, getBlockStyles } = select( blocksStore );
			const styles: Array< { name: string; label?: string } > =
				( blockName && getBlockStyles( blockName ) ) || [];
			return {
				blockTitle: blockName
					? getBlockType( blockName )?.title
					: undefined,
				variationLabel: variationName
					? styles.find( ( { name } ) => name === variationName )
							?.label
					: undefined,
				getStyleOriginUrl: settings[ styleOriginUrlKey ] as
					( ( section: string ) => string ) | undefined,
				userStyles: settings[ globalStylesUserDataKey ],
				mergedStyles: settings[ globalStylesDataKey ],
				blockCSS: clientId
					? ( select( blockEditorStore ).getBlockAttributes(
							clientId
						)?.style?.css as string | undefined )
					: undefined,
			};
		},
		[ blockName, variationName, clientId ]
	);

	// The block's parents, nearest first, with their names and attributes. The
	// selectors return stable references, so these only change with the tree.
	const parentIds: string[] = useSelect(
		( select ) =>
			clientId
				? select( blockEditorStore ).getBlockParents( clientId, true )
				: EMPTY_ARRAY,
		[ clientId ]
	);
	const parentNames: string[] = useSelect(
		( select ) =>
			parentIds.map( ( parentId ) =>
				select( blockEditorStore ).getBlockName( parentId )
			),
		[ parentIds ]
	);
	const parentAttributes: any[] = useSelect(
		( select ) =>
			parentIds.map( ( parentId ) =>
				select( blockEditorStore ).getBlockAttributes( parentId )
			),
		[ parentIds ]
	);

	const paths = Array.isArray( path ) ? path : [ path ];
	const elements = resolved?.elements ?? [];
	const isFromStyles =
		!! layer &&
		paths.some( ( onePath ) =>
			( layer === 'element' ? elements : [ undefined ] ).some(
				( element ) =>
					hasValueAt(
						userStyles,
						getTreePath(
							layer,
							onePath,
							blockName,
							variationName,
							element
						)
					)
			)
		);

	// For a property that inherits, a parent block that sets it wins over the
	// site-wide styles (which reach the block through the same inheritance),
	// but not over styles that target the block itself. Walk up to the nearest
	// parent that sets it, on the block or through its block type's styles.
	const inheritsFromParents =
		! hasLocalValue &&
		( ! layer || layer === 'root' ) &&
		paths.every( ( onePath ) => INHERITED_PATHS.has( onePath ) );
	const parent = useMemo( () => {
		if ( ! inheritsFromParents ) {
			return null;
		}
		for ( let i = 0; i < parentIds.length; i++ ) {
			const name = parentNames[ i ];
			if (
				paths.some(
					( onePath ) =>
						getOwnValue( parentAttributes[ i ], onePath ) !==
						undefined
				)
			) {
				return { clientId: parentIds[ i ], name, from: 'block' };
			}
			const parentLayer = name
				? getSourceLayer(
						resolveStyle(
							{ styles: mergedStyles ?? {} },
							{ blockName: name }
						).sources,
						paths
					)
				: undefined;
			if ( parentLayer === 'block' ) {
				const fromStyles = paths.some( ( onePath ) =>
					hasValueAt(
						userStyles,
						getTreePath( 'block', onePath, name )
					)
				);
				return {
					clientId: parentIds[ i ],
					name,
					from: fromStyles ? 'styles' : 'theme',
				};
			}
		}
		return null;
		// `paths` is derived from `path`.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		inheritsFromParents,
		parentIds,
		parentNames,
		parentAttributes,
		mergedStyles,
		userStyles,
		path,
	] );
	const parentTitle = parent
		? ( getRegisteredBlockType( parent.name )?.title ?? parent.name )
		: '';
	const parentCrumb = parent
		? getStylesCrumb(
				'/blocks/' + encodeURIComponent( parent.name ),
				parentTitle,
				''
			)
		: '';
	const { selectBlock } = useDispatch( blockEditorStore );

	// Every line says who set the value. For an inherited value it also says
	// it may be changed for this block, or, with the scope that would affect,
	// in the Styles screen named the way its menus read. Full
	// sentences per case, so translators can place the link.
	const title = blockTitle ?? blockName ?? '';
	const variation = variationLabel ?? variationName ?? '';
	const crumb = layer
		? getStylesCrumb(
				getStylesSection(
					layer,
					path,
					blockName,
					variationName,
					elements
				),
				title,
				variation
			)
		: '';
	// What a change in that Styles screen would affect, so the line is clear
	// that Styles is not only about this block.
	const elementKey = elements[ elements.length - 1 ];
	let scope = __( 'for the whole site' );
	if ( layer === 'blockVariation' ) {
		scope = sprintf(
			/* translators: %s: Block name, e.g. "Heading". */
			__( 'for all %s blocks with that style' ),
			title
		);
	} else if ( layer === 'block' ) {
		scope = sprintf(
			/* translators: %s: Block name, e.g. "Pullquote". */
			__( 'for all %s blocks' ),
			title
		);
	} else if ( layer === 'element' && elementKey === 'button' ) {
		scope = __( 'for all buttons' );
	} else if ( layer === 'element' && elementKey === 'link' ) {
		scope = __( 'for all links' );
	} else if ( layer === 'element' ) {
		scope = __( 'for all headings' );
	}

	let message;
	if ( hasLocalValue ) {
		message = __( 'Set on this block.' );
	} else if ( parent?.from === 'block' ) {
		message = sprintf(
			/* translators: %s: Parent block name, e.g. "Group". */
			__(
				'Inherited from the <select>%s block</select> it is inside, which sets it. You may change it for this block.'
			),
			parentTitle
		);
	} else if ( parent?.from === 'styles' ) {
		message = sprintf(
			/* translators: 1: Parent block name, e.g. "Group". 2: Where in Styles, e.g. "Styles → Blocks → Group". */
			__(
				'Inherited from the <select>%1$s block</select> it is inside, which gets it from the site’s Styles for all %1$s blocks, in <link>%2$s</link>. You may change it for this block.'
			),
			parentTitle,
			parentCrumb
		);
	} else if ( parent?.from === 'theme' ) {
		message = sprintf(
			/* translators: 1: Parent block name, e.g. "Group". 2: Where in Styles, e.g. "Styles → Blocks → Group". */
			__(
				'Inherited from the <select>%1$s block</select> it is inside, which gets it from the theme’s styles for all %1$s blocks. You may change it for this block, or in <link>%2$s</link>.'
			),
			parentTitle,
			parentCrumb
		);
	} else if ( ! isInherited || ! layer ) {
		message = __( 'Not set.' );
	} else if ( isFromStyles ) {
		message = sprintf(
			/* translators: 1: What it applies to, e.g. "for all headings". 2: Where in Styles, e.g. "Styles → Typography → Headings". */
			__(
				'Set in the site’s Styles %1$s, in <link>%2$s</link>. You may change it for this block.'
			),
			scope,
			crumb
		);
	} else if ( layer === 'blockVariation' ) {
		message = sprintf(
			/* translators: 1: Block style name, e.g. "Display". 2: What a change would apply to, e.g. "for all Heading blocks with that style". 3: Where in Styles, e.g. "Styles → Blocks → Heading → Display". */
			__(
				'Set by the theme’s “%1$s” style. You may change it for this block, or %2$s in <link>%3$s</link>.'
			),
			variation,
			scope,
			crumb
		);
	} else {
		message = sprintf(
			/* translators: 1: What a change would apply to, e.g. "for all headings". 2: Where in Styles, e.g. "Styles → Typography → Headings". */
			__(
				'Set by the theme. You may change it for this block, or %1$s in <link>%2$s</link>.'
			),
			scope,
			crumb
		);
	}

	// Custom CSS that sets the property, most specific first. With no value
	// from the Styles or the block, the CSS is where the value comes from;
	// otherwise it also sets it, and may win.
	const hasValue =
		!! hasLocalValue || !! parent || ( !! isInherited && !! layer );
	const blockCrumb = getStylesCrumb(
		'/blocks/' + encodeURIComponent( blockName ?? '' ),
		title,
		variation
	);
	const cssCrumb = getStylesCrumb( '/css', title, variation );
	const cssNotes: string[] = [];
	if ( blockName && cssSetsProperty( blockCSS, paths ) ) {
		cssNotes.push(
			hasValue
				? __(
						'This block’s Additional CSS also sets it and may override it.'
					)
				: __( 'Set by this block’s Additional CSS.' )
		);
	}
	if (
		blockName &&
		cssSetsProperty( mergedStyles?.blocks?.[ blockName ]?.css, paths )
	) {
		cssNotes.push(
			hasValue
				? sprintf(
						/* translators: %s: Where the CSS is, e.g. "Styles → Blocks → Pullquote". */
						__(
							'The CSS in <blockcss>%s</blockcss> also sets it and may override it.'
						),
						blockCrumb
					)
				: sprintf(
						/* translators: %s: Where the CSS is, e.g. "Styles → Blocks → Pullquote". */
						__( 'Set by the CSS in <blockcss>%s</blockcss>.' ),
						blockCrumb
					)
		);
	}
	if ( blockName && cssSetsProperty( mergedStyles?.css, paths, blockName ) ) {
		cssNotes.push(
			hasValue
				? sprintf(
						/* translators: 1: Where the CSS is, e.g. "Styles → Additional CSS". 2: Block name, e.g. "Heading". */
						__(
							'The site’s custom CSS in <sitecss>%1$s</sitecss> also sets it for %2$s blocks and may override it.'
						),
						cssCrumb,
						title
					)
				: sprintf(
						/* translators: 1: Where the CSS is, e.g. "Styles → Additional CSS". 2: Block name, e.g. "Heading". */
						__(
							'Set by the site’s custom CSS in <sitecss>%1$s</sitecss>, for %2$s blocks.'
						),
						cssCrumb,
						title
					)
		);
	}
	if ( ! hasValue && cssNotes.length ) {
		message = '';
	}

	const isShown = !! resolved;
	const announcement = [ message, ...cssNotes ]
		.filter( Boolean )
		.join( ' ' )
		.replace( /<\/?[a-z]+>/g, '' );
	// Announce the value the control fell back to after a reset.
	useEffect( () => {
		if ( isJustReset && isShown ) {
			speak( announcement );
		}
	}, [ isJustReset, isShown, announcement ] );

	if ( ! isShown ) {
		return null;
	}
	const link = ( section: string ) =>
		getStyleOriginUrl ? (
			<Link href={ getStyleOriginUrl( section ) } />
		) : (
			<span />
		);
	return (
		<div
			className={ clsx( 'global-styles-inheritance-help', {
				'is-shown': isInPopover || isJustReset,
				'is-in-popover': isInPopover,
				'is-description-only': isDescriptionOnly,
			} ) }
			id={ id }
		>
			<div className="global-styles-inheritance-help__content">
				{ message && (
					<span>
						{ createInterpolateElement( message, {
							link: ( () => {
								if ( parent ) {
									return link(
										'/blocks/' +
											encodeURIComponent( parent.name )
									);
								}
								return layer ? (
									link(
										getStylesSection(
											layer,
											path,
											blockName,
											variationName,
											elements
										)
									)
								) : (
									<span />
								);
							} )(),
							// Selects the parent block, so its own value or
							// block styles can be seen and changed.
							select: parent ? (
								<Button
									__next40pxDefaultSize={ false }
									variant="link"
									onClick={ () =>
										selectBlock( parent.clientId )
									}
								/>
							) : (
								<span />
							),
						} ) }
					</span>
				) }
				{ cssNotes.map( ( note ) => (
					<span key={ note }>
						{ createInterpolateElement( note, {
							blockcss: link(
								'/blocks/' +
									encodeURIComponent( blockName ?? '' )
							),
							sitecss: link( '/css' ),
						} ) }
					</span>
				) ) }
			</div>
		</div>
	);
}

/**
 * Whether a stylesheet has a selector for a block's default class, e.g.
 * `.wp-block-heading` or `.wp-block-button__link`, but not
 * `.wp-block-buttons`. A text match, so it misses selectors that reach the
 * block another way (`h2`, `:is(...)`).
 *
 * @param css       Stylesheet.
 * @param blockName Block name.
 * @return Whether the stylesheet names the block's class.
 */
export function cssTargetsBlock( css: string, blockName: string ): boolean {
	const className = getBlockDefaultClassName( blockName );
	const escaped = className.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	return new RegExp( '\\.' + escaped + '(?![a-zA-Z0-9-])' ).test( css );
}

/**
 * Names the custom CSS the site styles add for a block, under the block's
 * own Additional CSS field: CSS set for the block type in Styles, and
 * site-wide custom CSS that names the block's class. Each source links to
 * the Styles screen where that CSS is edited.
 *
 * @param props           Component props.
 * @param props.blockName Block name.
 * @return The lines, or `null` when the site styles add no CSS for the block.
 */
export function InheritedCustomCSSHelp( { blockName }: { blockName: string } ) {
	const { blockCSS, rootCSS, blockTitle, getStyleOriginUrl } = useSelect(
		( select ) => {
			const settings = select( blockEditorStore ).getSettings() as Record<
				symbol,
				any
			>;
			const styles = settings[ globalStylesDataKey ] ?? {};
			return {
				blockCSS: styles.blocks?.[ blockName ]?.css as
					string | undefined,
				rootCSS: styles.css as string | undefined,
				blockTitle:
					select( blocksStore ).getBlockType( blockName )?.title,
				getStyleOriginUrl: settings[ styleOriginUrlKey ] as
					( ( section: string ) => string ) | undefined,
			};
		},
		[ blockName ]
	);
	const link = ( section: string ) =>
		getStyleOriginUrl ? (
			<Link href={ getStyleOriginUrl( section ) } />
		) : (
			<span />
		);
	const hasBlockCSS = !! blockCSS?.trim();
	const hasRootCSS = !! rootCSS && cssTargetsBlock( rootCSS, blockName );
	if ( ! hasBlockCSS && ! hasRootCSS ) {
		return null;
	}
	return (
		<div className="global-styles-inheritance-help is-shown is-custom-css">
			<div className="global-styles-inheritance-help__content">
				{ hasBlockCSS && (
					<span>
						{ createInterpolateElement(
							sprintf(
								/* translators: %s: Where the CSS is, e.g. "Styles → Blocks → Heading". */
								__(
									'The CSS in <link>%s</link> also applies to this block.'
								),
								getStylesCrumb(
									'/blocks/' +
										encodeURIComponent( blockName ),
									blockTitle ?? blockName,
									''
								)
							),
							{
								link: link(
									'/blocks/' + encodeURIComponent( blockName )
								),
							}
						) }
					</span>
				) }
				{ hasRootCSS && (
					<span>
						{ createInterpolateElement(
							sprintf(
								/* translators: 1: Where the CSS is, e.g. "Styles → Additional CSS". 2: Block name, e.g. "Heading". */
								__(
									'The site’s custom CSS in <link>%1$s</link> also targets %2$s blocks.'
								),
								getStylesCrumb( '/css', '', '' ),
								blockTitle ?? blockName
							),
							{ link: link( '/css' ) }
						) }
					</span>
				) }
			</div>
		</div>
	);
}
