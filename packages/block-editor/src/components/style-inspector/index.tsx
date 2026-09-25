import clsx from 'clsx';
import { Button } from '@wordpress/components';
import { closeSmall } from '@wordpress/icons';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as blocksStore } from '@wordpress/blocks';
import { Text, VisuallyHidden } from '@wordpress/ui';
import { store as blockEditorStore } from '../../store';
import {
	globalStylesBaseDataKey,
	globalStylesUserDataKey,
} from '../../store/private-keys';
import { useSettings } from '../use-settings';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import { useResolvedStyleForBlock } from '../global-styles/inherited-value-context';
import { getValueFromObjectPath } from '../../utils/object';
import { compactValues, getInspectorGroups, getStylePaths } from './properties';
import {
	resolveCustomProperties,
	traceCascade,
	traceOtherProperties,
} from './trace-cascade';
import { describeDeclaration, getPresetLabel } from './describe-source';

/**
 * Whether the style inspector is available. It is a local exploration and is
 * always on; this is the single place a flag would go.
 *
 * @return {boolean} Whether the style inspector is enabled.
 */
export const isStyleInspectorEnabled = () => true;

const NO_PARENTS = [];

// Computed values that mean "nothing set", hidden unless everything is shown.
const EMPTY_LOOKING_VALUES = new Set( [
	'',
	'0px',
	'none',
	'normal',
	'auto',
	'rgba(0, 0, 0, 0)',
	'transparent',
] );

// Preset types as they appear in `--wp--preset--{type}--{slug}`, mapped to
// the settings paths that hold their names.
const PRESET_SETTINGS = {
	color: [ 'color.palette' ],
	gradient: [ 'color.gradients' ],
	'font-size': [ 'typography.fontSizes' ],
	'font-family': [ 'typography.fontFamilies' ],
	spacing: [ 'spacing.spacingSizes' ],
	shadow: [ 'shadow.presets' ],
};

function usePresetNames() {
	const paths = Object.values( PRESET_SETTINGS ).flat();
	const values = useSettings( ...paths );
	return useMemo( () => {
		const names = {};
		Object.keys( PRESET_SETTINGS ).forEach( ( type, index ) => {
			const setting = values[ index ];
			// Palettes are split by origin (default, theme, custom).
			const presets = Array.isArray( setting )
				? setting
				: Object.values( setting ?? {} ).flat();
			for ( const preset of presets ) {
				if ( preset?.slug ) {
					names[ `${ type }|${ preset.slug }` ] = preset.name;
				}
			}
		} );
		return ( type, slug ) => names[ `${ type }|${ slug }` ];
	}, [ values ] );
}

function isEmptyStyleValue( value ) {
	return (
		value === undefined ||
		value === null ||
		value === '' ||
		( typeof value === 'object' && ! Object.keys( value ).length )
	);
}

// `rgb(179, 38, 30)` → `#b3261e`, which is what the color pickers show.
function toHex( value ) {
	const match = value
		?.trim()
		.match( /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/ );
	if ( ! match ) {
		return value;
	}
	if ( match[ 4 ] !== undefined && Number( match[ 4 ] ) < 1 ) {
		return value;
	}
	return (
		'#' +
		match
			.slice( 1, 4 )
			.map( ( channel ) =>
				Number( channel ).toString( 16 ).padStart( 2, '0' )
			)
			.join( '' )
	);
}

function isSameText( a, b ) {
	return (
		typeof a === 'string' &&
		typeof b === 'string' &&
		a.trim().toLowerCase() === b.trim().toLowerCase()
	);
}

// `22.755px` → `22.8px`: sub-pixel digits add noise, not meaning.
function roundPixels( value ) {
	return value.replace(
		/(\d+\.\d{2,})px/g,
		( match, number ) => `${ Math.round( Number( number ) * 10 ) / 10 }px`
	);
}

// Fluid sizes are written as `clamp( min, preferred, max )`; say what that
// means instead of showing the formula.
function describeClamp( value ) {
	const match = value.match( /^clamp\(\s*([^,]+),\s*[^,]+,\s*([^,)]+)\)$/ );
	if ( ! match ) {
		return value;
	}
	return sprintf(
		/* translators: 1: smallest size, e.g. "1.1rem". 2: largest size, e.g. "1.75rem". */
		__( '%1$s to %2$s, by screen width' ),
		match[ 1 ].trim(),
		match[ 2 ].trim()
	);
}

function formatComputedValue( property, value ) {
	if ( property.isColor ) {
		return toHex( value );
	}
	value = roundPixels( value );
	if ( property.longhands[ 0 ] === 'font-family' ) {
		// The first family is the one that renders when it is available.
		return value.split( ',' )[ 0 ].replace( /["']/g, '' ).trim();
	}
	return value;
}

// The first value set at any of a property's Styles paths.
function getValueAtPaths( tree, property, prefix = '' ) {
	for ( const path of getStylePaths( property ) ) {
		const value = getValueFromObjectPath( tree, `${ prefix }${ path }` );
		if ( ! isEmptyStyleValue( value ) ) {
			return value;
		}
	}
	return undefined;
}

function hasLocalValue( attributes, property ) {
	return (
		! isEmptyStyleValue( getValueAtPaths( attributes?.style, property ) ) ||
		( !! property.presetAttribute &&
			!! attributes?.[ property.presetAttribute ] )
	);
}

/**
 * The quick answer, read from the block editor's own data without touching a
 * stylesheet: this block's attributes, its parents' attributes, and the
 * resolved Global Styles. It is right in the common cases; "Where does this
 * come from?" traces the canvas to confirm it, and to catch what the editor's
 * data cannot see (theme stylesheets, block defaults, custom CSS).
 *
 * @param {Object} property Property from `getInspectorGroups`.
 * @param {Object} context  Block data, parents, and resolved Global Styles.
 * @return {{ kind: string, label: string, presetValue?: any, parentClientId?: string }}
 * Quick source.
 */
function getQuickSource( property, context ) {
	const { attributes, parents, resolved, names } = context;

	if ( hasLocalValue( attributes, property ) ) {
		const presetSlug = property.presetAttribute
			? attributes[ property.presetAttribute ]
			: null;
		return {
			kind: 'block',
			label: __( 'Customized here' ),
			presetValue: presetSlug
				? `var:preset|${ presetTypeFor( property ) }|${ presetSlug }`
				: getValueAtPaths( attributes.style, property ),
		};
	}

	const stylePaths = getStylePaths( property );
	const layer = Object.entries( resolved.sources ?? {} ).find( ( [ path ] ) =>
		stylePaths.some(
			( stylePath ) =>
				path === stylePath || path.startsWith( `${ stylePath }.` )
		)
	)?.[ 1 ]?.layer;
	const globalValue = getValueAtPaths( resolved.value, property );

	// Styles that Global Styles aim at this block type (or its element, or
	// its block style) apply to the block directly, so they beat anything a
	// parent passes down.
	switch ( layer ) {
		case 'blockVariation':
			return {
				kind: 'global',
				label: sprintf(
					/* translators: %s: block style name, e.g. "Subtitle". */
					__( '“%s” style' ),
					names.variation
				),
				presetValue: globalValue,
			};
		case 'block':
			return {
				kind: 'global',
				label: sprintf(
					/* translators: %s: block title, e.g. "Paragraph". */
					__( 'Site styles · %s' ),
					names.blockType
				),
				presetValue: globalValue,
			};
		case 'element':
			return {
				kind: 'global',
				label: getElementLabel( resolved.elements.at( -1 ) ),
				presetValue: globalValue,
			};
	}

	if ( property.inherits ) {
		const parent = parents.find( ( { attributes: parentAttributes } ) =>
			hasLocalValue( parentAttributes, property )
		);
		if ( parent ) {
			return {
				kind: 'parent',
				label: sprintf(
					/* translators: %s: block title, e.g. "Group". */
					__( 'From the %s block' ),
					parent.title
				),
				parentClientId: parent.clientId,
			};
		}
	}

	if ( layer === 'root' ) {
		return {
			kind: 'global',
			label: __( 'Site styles' ),
			presetValue: globalValue,
		};
	}
	return property.inherits
		? { kind: 'unknown', label: __( 'From the page' ) }
		: {
				kind: 'default',
				label: __( 'Not set' ),
			};
}

function ColorSwatch( { value } ) {
	return (
		<span
			className="block-editor-style-inspector__swatch"
			style={ { background: value } }
			aria-hidden="true"
		/>
	);
}

// A declared value in words: its preset name, or the value made readable.
function formatDeclaredValue( property, declaration, owner, getPresetName ) {
	if ( declaration.value === 'inherit' ) {
		return __( 'Inherited' );
	}
	const presetLabel = getPresetLabel( declaration.value, getPresetName );
	const resolved = resolveCustomProperties( owner, declaration.value );
	if ( presetLabel ) {
		return property.isColor && resolved
			? `${ presetLabel } (${ toHex( resolved ) })`
			: presetLabel;
	}
	return formatComputedValue(
		property,
		describeClamp( resolved ?? declaration.value )
	);
}

// The same source and value can arrive twice, for example a preset class
// printed by two stylesheets. Keep the first (strongest) of each.
function dedupeDeclarations( declarations, owner, describeContext ) {
	const seen = new Set();
	return declarations.filter( ( declaration ) => {
		const key = [
			describeDeclaration( declaration, { ...describeContext, owner } )
				.label,
			resolveCustomProperties( owner, declaration.value ) ??
				declaration.value,
		].join( '|' );
		if ( seen.has( key ) ) {
			return false;
		}
		seen.add( key );
		return true;
	} );
}

// Site Editor sections that hold root-level values, so a label names the
// place a person would go to change them.
function getRootSection( stylePath ) {
	if ( stylePath.startsWith( 'color' ) ) {
		return __( 'Colors' );
	}
	if ( stylePath.startsWith( 'typography' ) ) {
		return __( 'Typography' );
	}
	return __( 'Layout' );
}

function getElementSection( element ) {
	if ( /^h[1-6]$/.test( element ) ) {
		return element.toUpperCase();
	}
	return (
		{
			heading: __( 'Headings' ),
			button: __( 'Buttons' ),
			link: __( 'Links' ),
			caption: __( 'Captions' ),
		}[ element ] ?? element
	);
}

// `var:preset|color|contrast` → `var(--wp--preset--color--contrast)`.
function toCSSValue( value ) {
	return typeof value === 'string'
		? value.replace(
				/^var:preset\|([\w-]+)\|([\w-]+)$/,
				'var(--wp--preset--$1--$2)'
			)
		: value;
}

function formatConfigValue( property, value, element, getPresetName ) {
	if ( value && typeof value === 'object' ) {
		if ( value.ref ) {
			return __( 'Linked to another style' );
		}
		const sides = [ 'top', 'right', 'bottom', 'left' ];
		if ( sides.some( ( side ) => side in value ) ) {
			return compactValues(
				sides.map( ( side ) =>
					value[ side ] === undefined
						? '—'
						: formatConfigValue(
								property,
								value[ side ],
								element,
								getPresetName
							)
				)
			);
		}
		return JSON.stringify( value );
	}
	return formatDeclaredValue(
		property,
		{ value: toCSSValue( String( value ) ) },
		element,
		getPresetName
	);
}

/**
 * Where Styles (Global Styles) set a property for this block, strongest
 * first, keeping the theme's value and the site's changes apart: the canvas
 * only ever sees them merged.
 *
 * @param {Object}  property Property from `getInspectorGroups`.
 * @param {Object}  context  Block, its Global Styles layers, and the configs.
 * @param {Element} element  Element being inspected, to resolve presets.
 * @return {Object[]} Entries with `label`, `origin` and `value`.
 */
function getGlobalStylesEntries( property, context, element ) {
	const {
		blockName,
		blockTitle,
		variationName,
		variationLabel,
		elements,
		base,
		user,
		getPresetName,
		includeRoot = true,
	} = context;
	if ( ! blockName || ! getStylePaths( property ).length ) {
		return [];
	}
	const layers = [];
	if ( variationName ) {
		layers.push( {
			path: `blocks.${ blockName }.variations.${ variationName }`,
			label: sprintf(
				/* translators: 1: block title, e.g. "Paragraph". 2: block style name, e.g. "Subtitle". */
				__( 'Styles › Blocks › %1$s › %2$s' ),
				blockTitle,
				variationLabel
			),
		} );
	}
	layers.push( {
		path: `blocks.${ blockName }`,
		label: sprintf(
			/* translators: %s: block title, e.g. "Paragraph". */
			__( 'Styles › Blocks › %s' ),
			blockTitle
		),
	} );
	[ ...elements ].reverse().forEach( ( name ) =>
		layers.push( {
			path: `elements.${ name }`,
			label: sprintf(
				/* translators: %s: element, e.g. "H2" or "Buttons". */
				__( 'Styles › Typography › %s' ),
				getElementSection( name )
			),
		} )
	);
	// Root values reach a block only through inheritance. For a parent
	// block, they are this block's own root layer instead.
	if ( property.inherits && includeRoot ) {
		layers.push( {
			path: null,
			label: sprintf(
				/* translators: %s: Styles section, e.g. "Typography". */
				__( 'Styles › %s' ),
				getRootSection( getStylePaths( property )[ 0 ] )
			),
		} );
	}

	const entries = [];
	for ( const layer of layers ) {
		const prefix = layer.path ? `${ layer.path }.` : '';
		const userValue = getValueAtPaths( user, property, prefix );
		const themeValue = getValueAtPaths( base, property, prefix );
		if ( ! isEmptyStyleValue( userValue ) ) {
			entries.push( {
				label: __( 'Global styles' ),
				route: layer.label,
				origin: 'user',
				preset: getPresetLabel(
					toCSSValue( userValue ),
					getPresetName
				),
				value: formatConfigValue(
					property,
					userValue,
					element,
					getPresetName
				),
			} );
		}
		if (
			! isEmptyStyleValue( themeValue ) &&
			JSON.stringify( themeValue ) !== JSON.stringify( userValue )
		) {
			entries.push( {
				label: __( 'Theme' ),
				route: layer.label,
				origin: 'theme',
				preset: getPresetLabel(
					toCSSValue( themeValue ),
					getPresetName
				),
				value: formatConfigValue(
					property,
					themeValue,
					element,
					getPresetName
				),
			} );
		}
	}
	return entries;
}

/**
 * Every place that sets a property for this block, strongest first: what
 * the canvas's stylesheets say, with the Global Styles rules among them
 * replaced by the Styles locations (theme or customized) they came from.
 *
 * @param {Object}    property         Property from `getInspectorGroups`.
 * @param {?Object}   trace            The property's result from `traceCascade`.
 * @param {Element}   element          Element being inspected.
 * @param {Object}    describeContext  Context for `describeDeclaration`.
 * @param {?Object[]} globalEntries    From `getGlobalStylesEntries`, or `null`
 *                                     for properties Styles does not cover.
 * @param {Function}  getParentEntries Styles entries for a parent block, by
 *                                     client ID, for values it passes down.
 * @return {Object[]} Origins; the first is the one in effect.
 */
function getOrigins(
	property,
	trace,
	element,
	describeContext,
	globalEntries,
	getParentEntries
) {
	if ( ! trace ) {
		return [];
	}
	const inspectedBlock = element.closest( '[data-block]' );
	const entries = trace.declarations.length
		? [ { element, declarations: trace.declarations } ]
		: trace.inherited;
	const traced = entries.flatMap( ( entry ) =>
		dedupeDeclarations(
			entry.declarations,
			entry.element,
			describeContext
		).map( ( declaration ) => {
			const owner = entry.element;
			const description = describeDeclaration( declaration, {
				...describeContext,
				owner,
			} );
			const ownerBlock = owner.closest( '[data-block]' );
			// A value passed down from another block is that block's to change.
			const fromBlockId =
				ownerBlock && ownerBlock !== inspectedBlock
					? ownerBlock.dataset.block
					: null;
			const kind = fromBlockId ? 'parent' : description.kind;
			return {
				isGlobalStyles: !! description.isGlobalStyles,
				// Set by someone on this site, rather than by the theme or a
				// block's own stylesheet: on a block (this one or a parent),
				// or in Global CSS. Styles values are judged by their layer.
				isCustomized:
					! description.isGlobalStyles &&
					( kind === 'block' ||
						kind === 'parent' ||
						kind === 'global' ),
				label:
					fromBlockId && ! description.isGlobalStyles
						? sprintf(
								/* translators: %s: block title, e.g. "Group". */
								__( 'From the %s block' ),
								describeContext.getBlockTitle( fromBlockId )
							)
						: description.label,
				kind,
				clientId: fromBlockId,
				preset: getPresetLabel(
					declaration.value,
					describeContext.getPresetName
				),
				value: formatDeclaredValue(
					property,
					declaration,
					owner,
					describeContext.getPresetName
				),
			};
		} )
	);

	// Global Styles rules in the canvas are replaced by the Styles layers they
	// came from. Rules on this block (or the page) come from this block's
	// layers; a rule on a parent block comes from that block's layers, and is
	// passed down. Without Styles data (the catch-all), rules stay as traced.
	const own = ( globalEntries ?? [] ).map( ( entry ) => ( {
		...entry,
		kind: 'global',
		isCustomized: entry.origin === 'user',
	} ) );
	let isOwnListed = globalEntries === null;
	const expandedParents = new Set();
	const origins = [];
	for ( const entry of traced ) {
		if ( ! entry.isGlobalStyles || globalEntries === null ) {
			origins.push( entry );
		} else if ( entry.clientId ) {
			if ( expandedParents.has( entry.clientId ) ) {
				continue;
			}
			expandedParents.add( entry.clientId );
			const parentEntries = getParentEntries( entry.clientId );
			if ( ! parentEntries.length ) {
				origins.push( entry );
				continue;
			}
			const title = describeContext.getBlockTitle( entry.clientId );
			origins.push(
				...parentEntries.map( ( parentEntry ) => ( {
					...parentEntry,
					label: sprintf(
						/* translators: 1: block title, e.g. "Group". 2: where the parent's value was set, e.g. "Global styles" or "Theme". */
						__( 'From the %1$s block · %2$s' ),
						title,
						parentEntry.label
					),
					kind: 'parent',
					clientId: entry.clientId,
					isCustomized: parentEntry.origin === 'user',
				} ) )
			);
		} else if ( ! isOwnListed ) {
			origins.push( ...own );
			isOwnListed = true;
		}
	}
	// When something stronger already set the value on this block, its
	// Styles values never reach its CSS, but they are still what it
	// overrides: list them underneath.
	if ( ! isOwnListed ) {
		origins.push( ...own );
	}

	// One line per place: the same place can reach the canvas twice, such
	// as a preset class printed by two stylesheets.
	const seen = new Set();
	return origins.filter( ( entry ) => {
		// Styles values share a label ("Theme"), so they are told apart by route.
		const key = `${ entry.clientId ?? '' }|${ entry.route ?? entry.label }|${
			entry.origin ?? ''
		}`;
		if ( seen.has( key ) ) {
			return false;
		}
		seen.add( key );
		return true;
	} );
}

function PropertyRow( {
	property,
	computedValue,
	quickSource,
	origins,
	getPresetName,
	onSelectBlock,
} ) {
	const [ inEffect, ...rest ] = origins.length ? origins : [ quickSource ];
	// Name the preset from the origin in use, so it always matches the value.
	const presetLabel = origins.length
		? inEffect.preset
		: getPresetLabel( quickSource.presetValue, getPresetName );
	const displayValue = formatComputedValue( property, computedValue );
	// A lower layer holding the same value replaced nothing a person would see.
	const overridden = rest.filter(
		( entry ) => ! isSameText( entry.value, inEffect.value )
	);

	return (
		<li className="block-editor-style-inspector__property">
			<div className="block-editor-style-inspector__property-header">
				<span className="block-editor-style-inspector__property-label">
					{ property.label }
				</span>
				<span
					className="block-editor-style-inspector__property-value"
					title={ computedValue }
				>
					{ property.isColor && (
						<ColorSwatch value={ computedValue } />
					) }
					{ presetLabel && (
						<span className="block-editor-style-inspector__preset">
							{ presetLabel }
						</span>
					) }
					{ ! isSameText( presetLabel, displayValue ) && (
						<span className="block-editor-style-inspector__raw">
							{ displayValue }
						</span>
					) }
				</span>
			</div>
			<ul className="block-editor-style-inspector__sources">
				<li
					className={ clsx(
						'block-editor-style-inspector__source',
						`is-${ inEffect.kind }`
					) }
				>
					<OriginLabel origin={ inEffect } />
					{ inEffect.clientId && (
						<Button
							size="small"
							variant="link"
							onClick={ () => onSelectBlock( inEffect.clientId ) }
						>
							{ __( 'Inspect' ) }
						</Button>
					) }
				</li>
				{ overridden.map( ( entry, index ) => (
					<li
						key={ index }
						className="block-editor-style-inspector__overridden"
					>
						<s>{ entry.value }</s>
						<VisuallyHidden>
							{ __( '(overridden)' ) }
						</VisuallyHidden>
						<span aria-hidden="true">{ ' · ' }</span>
						<OriginLabel origin={ entry } />
					</li>
				) ) }
			</ul>
		</li>
	);
}

// Where a value was set. For Styles values the full route is a tooltip.
function OriginLabel( { origin } ) {
	return (
		<span
			className="block-editor-style-inspector__origin"
			title={ origin.route }
		>
			{ origin.label }
		</span>
	);
}

function getElementLabel( element ) {
	if ( /^h[1-6]$/.test( element ) ) {
		return sprintf(
			/* translators: %s: heading level, e.g. "H2". */
			__( 'Site styles · %s headings' ),
			element.toUpperCase()
		);
	}
	switch ( element ) {
		case 'heading':
			return __( 'Site styles · Headings' );
		case 'button':
			return __( 'Site styles · Buttons' );
		case 'link':
			return __( 'Site styles · Links' );
	}
	return __( 'Site styles' );
}

// Preset attribute slugs (`textColor: 'accent-4'`) name their type implicitly.
function presetTypeFor( property ) {
	switch ( property.presetAttribute ) {
		case 'fontSize':
			return 'font-size';
		case 'fontFamily':
			return 'font-family';
		case 'gradient':
			return 'gradient';
		default:
			return 'color';
	}
}

/**
 * The element a block's styles paint. Usually the block's wrapper, but some
 * blocks declare an inner element in `block.json` (`selectors.root`): Button
 * styles its link, not the wrapper around it.
 *
 * @param {?Element} blockElement Block wrapper in the canvas.
 * @param {?string}  rootSelector The block type's `selectors.root`.
 * @return {?Element} Element to inspect.
 */
function getStyledElement( blockElement, rootSelector ) {
	if ( ! blockElement || ! rootSelector ) {
		return blockElement;
	}
	try {
		if ( blockElement.matches( rootSelector ) ) {
			return blockElement;
		}
		return blockElement.querySelector( rootSelector ) ?? blockElement;
	} catch {
		return blockElement;
	}
}

function readComputedValues( element, properties ) {
	const computed =
		element.ownerDocument.defaultView.getComputedStyle( element );
	return Object.fromEntries(
		properties.map( ( property ) => [
			property.longhands[ 0 ],
			compactValues(
				property.longhands.map( ( longhand ) =>
					computed.getPropertyValue( longhand )
				)
			),
		] )
	);
}

/**
 * Explains where a block's styles come from: for each style someone
 * customized, the value in use, where it was set (this block, a parent
 * block, Global styles, the theme, Block CSS or Global CSS), and what it
 * replaced.
 *
 * Values are traced through every stylesheet in the canvas and up through
 * the blocks around it, like a browser's element inspector does, for the
 * properties the block inspector knows about. "Show all" also lists styles
 * still at the theme's value, and runs a catch-all over every CSS rule for
 * properties no block setting covers; that is the expensive part, so it only
 * runs on demand.
 *
 * @param {Object}    props
 * @param {?string}   props.clientId Client ID of the block to explain.
 * @param {?Function} props.onClose  Closes the inspector, when it can be.
 */
export default function StyleInspector( { clientId, onClose } ) {
	const [ showAll, setShowAll ] = useState( false );
	const [ snapshot, setSnapshot ] = useState( null );
	const { selectBlock } = useDispatch( blockEditorStore );

	const blockElement = useBlockElement( clientId );
	const rootSelector = useSelect(
		( select ) => {
			const name = clientId
				? select( blockEditorStore ).getBlockName( clientId )
				: null;
			const selectors = name
				? select( blocksStore ).getBlockType( name )?.selectors
				: null;
			return typeof selectors?.root === 'string' ? selectors.root : null;
		},
		[ clientId ]
	);
	const element = useMemo(
		() => getStyledElement( blockElement, rootSelector ),
		[ blockElement, rootSelector ]
	);
	const { attributes, blockName, parents } = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return {
					attributes: null,
					blockName: null,
					parents: NO_PARENTS,
				};
			}
			const { getBlockAttributes, getBlockName, getBlockParents } =
				select( blockEditorStore );
			return {
				attributes: getBlockAttributes( clientId ),
				blockName: getBlockName( clientId ),
				parents: getBlockParents( clientId, true ),
			};
		},
		[ clientId ]
	);
	// Everything read from the stores stays referentially stable while the
	// blocks do not change: values here feed the effect that re-reads the
	// canvas, so a fresh array or function on every store update would
	// re-trace every frame.
	const registry = useRegistry();
	const parentBlocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocksByClientId( parents ),
		[ parents ]
	);
	const { blockTypeTitle, blockStyles } = useSelect(
		( select ) => {
			const { getBlockType, getBlockStyles } = select( blocksStore );
			return {
				blockTypeTitle: blockName
					? ( getBlockType( blockName )?.title ?? blockName )
					: '',
				blockStyles: blockName ? getBlockStyles( blockName ) : null,
			};
		},
		[ blockName ]
	);
	const getTypeTitle = useCallback(
		( blockClass ) =>
			registry
				.select( blocksStore )
				.getBlockType( `core/${ blockClass }` )?.title ?? blockClass,
		[ registry ]
	);
	const getBlockTitle = useCallback(
		( id ) => {
			const name = registry.select( blockEditorStore ).getBlockName( id );
			return (
				registry.select( blocksStore ).getBlockType( name )?.title ??
				name
			);
		},
		[ registry ]
	);
	const parentData = useMemo(
		() =>
			parentBlocks.map( ( block ) => ( {
				clientId: block.clientId,
				attributes: block.attributes,
				title: getBlockTitle( block.clientId ),
			} ) ),
		[ parentBlocks, getBlockTitle ]
	);
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const resolved = useResolvedStyleForBlock( clientId );
	const { baseStyles, userStyles } = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return {
			baseStyles: settings[ globalStylesBaseDataKey ],
			userStyles: settings[ globalStylesUserDataKey ],
		};
	}, [] );
	const getPresetName = usePresetNames();

	const groups = useMemo( () => getInspectorGroups(), [] );
	const properties = useMemo(
		() => groups.flatMap( ( group ) => group.properties ),
		[ groups ]
	);

	// Styles land in the canvas a frame or two after the store changes, so
	// values are read after paint, and again whenever the canvas's
	// stylesheets change. Every value is traced, so each row can show what
	// it overrides without being opened.
	const refresh = useCallback( () => {
		if ( ! element?.isConnected ) {
			setSnapshot( null );
			return;
		}
		const snapshotData = {
			element,
			computed: readComputedValues( element, properties ),
			trace: traceCascade( element, properties ),
		};
		// The catch-all tests every CSS rule in the canvas against the block,
		// so it only runs while everything is being shown.
		if ( showAll ) {
			const other = traceOtherProperties(
				element,
				properties.flatMap( ( property ) => property.longhands )
			);
			const computed =
				element.ownerDocument.defaultView.getComputedStyle( element );
			snapshotData.other = other.map(
				( { property, declarations } ) => ( {
					property: {
						label: property,
						longhands: [ property ],
						isOther: true,
					},
					computedValue: computed.getPropertyValue( property ),
					trace: { declarations, inherited: [] },
				} )
			);
		}
		setSnapshot( snapshotData );
	}, [ element, properties, showAll ] );

	// A short timer rather than an animation frame: frames pause while the
	// tab is in the background, which would leave the panel empty.
	const timerRef = useRef();
	const scheduleRefresh = useCallback( () => {
		const view = element?.ownerDocument.defaultView ?? window;
		view.clearTimeout( timerRef.current );
		timerRef.current = view.setTimeout( refresh, 50 );
	}, [ element, refresh ] );

	useEffect( () => {
		scheduleRefresh();
	}, [ scheduleRefresh, attributes, parentData, resolved ] );

	useEffect( () => {
		if ( ! element ) {
			return;
		}
		const doc = element.ownerDocument;
		const observer = new doc.defaultView.MutationObserver(
			scheduleRefresh
		);
		observer.observe( doc.head, {
			childList: true,
			subtree: true,
			characterData: true,
		} );
		observer.observe( element, {
			attributes: true,
			attributeFilter: [ 'class', 'style' ],
		} );
		return () => observer.disconnect();
	}, [ element, scheduleRefresh ] );

	const onSelectBlock = useCallback(
		( id ) => selectBlock( id, null ),
		[ selectBlock ]
	);

	const getStyleLabel = useCallback(
		( name ) =>
			blockStyles?.find( ( style ) => style.name === name )?.label ??
			name,
		[ blockStyles ]
	);

	const describeContext = {
		inspected: element,
		getBlockTitle,
		getTypeTitle,
		getStyleLabel,
		getPresetName,
	};

	const globalStylesContext = {
		blockName,
		blockTitle: blockTypeTitle,
		variationName: resolved.variationName,
		variationLabel: getStyleLabel( resolved.variationName ),
		elements: resolved.elements ?? [],
		base: baseStyles,
		user: userStyles,
		getPresetName,
	};

	// A parent block's own Styles layers, for values it passes down. Its
	// root layer is left out: that one reaches this block directly.
	const getParentStylesEntries = ( property, parentClientId ) => {
		const { getBlockName: getName, getBlockAttributes } =
			registry.select( blockEditorStore );
		const parentName = getName( parentClientId );
		const className = getBlockAttributes( parentClientId )?.className ?? '';
		const parentVariation =
			className.match( /(?:^|\s)is-style-([\w-]+)/ )?.[ 1 ] ?? null;
		const variationName =
			parentVariation === 'default' ? null : parentVariation;
		return getGlobalStylesEntries(
			property,
			{
				...globalStylesContext,
				blockName: parentName,
				blockTitle: getBlockTitle( parentClientId ),
				variationName,
				variationLabel:
					registry
						.select( blocksStore )
						.getBlockStyles( parentName )
						?.find( ( style ) => style.name === variationName )
						?.label ?? variationName,
				elements: [],
				includeRoot: false,
			},
			element
		);
	};

	const isCurrent = !! snapshot && snapshot.element === element;

	const otherByKey = Object.fromEntries(
		( snapshot?.other ?? [] ).map( ( entry ) => [
			entry.property.longhands[ 0 ],
			entry,
		] )
	);
	const shownGroups =
		showAll && snapshot?.other?.length
			? [
					...groups,
					{
						name: 'other',
						label: __( 'Other CSS' ),
						properties: snapshot.other.map(
							( entry ) => entry.property
						),
					},
				]
			: groups;
	const groupElements = ! isCurrent
		? []
		: shownGroups.map( ( group ) => {
				const rows = group.properties
					.map( ( property ) => {
						const key = property.longhands[ 0 ];
						const other = property.isOther
							? otherByKey[ key ]
							: null;
						if ( other ) {
							return {
								key,
								property,
								computedValue: other.computedValue,
								quickSource: {
									kind: 'default',
									label: __( 'Not set' ),
								},
								origins: getOrigins(
									property,
									other.trace,
									element,
									describeContext,
									null,
									() => []
								),
							};
						}
						return {
							key,
							property,
							computedValue: snapshot.computed[ key ],
							quickSource: getQuickSource( property, {
								attributes,
								parents: parentData,
								resolved,
								names: {
									blockType: blockTypeTitle,
									variation: getStyleLabel(
										resolved.variationName
									),
								},
							} ),
							origins: getOrigins(
								property,
								snapshot.trace.results[ key ],
								element,
								describeContext,
								getGlobalStylesEntries(
									property,
									globalStylesContext,
									element
								),
								( parentClientId ) =>
									getParentStylesEntries(
										property,
										parentClientId
									)
							),
						};
					} )
					// By default only what someone changed: anything still
					// at the theme's or a block's own value is one click away.
					.filter(
						( row ) => showAll || !! row.origins[ 0 ]?.isCustomized
					)
					// Show all hides nothing.
					.filter(
						( row ) =>
							showAll ||
							! (
								row.property.needsBorder &&
								snapshot.computed[ 'border-top-style' ] ===
									'none'
							)
					)
					.filter(
						( row ) =>
							showAll ||
							! [ 'default', 'unknown' ].includes(
								row.quickSource.kind
							) ||
							! EMPTY_LOOKING_VALUES.has( row.computedValue )
					);
				if ( ! rows.length ) {
					return null;
				}
				return (
					<div
						key={ group.name }
						className="block-editor-style-inspector__group"
					>
						<Text
							variant="heading-sm"
							render={ <h3 /> }
							className="block-editor-style-inspector__group-title"
						>
							{ group.label }
						</Text>
						<ul>
							{ rows.map( ( row ) => (
								<PropertyRow
									key={ row.key }
									property={ row.property }
									computedValue={ row.computedValue }
									quickSource={ row.quickSource }
									origins={ row.origins }
									getPresetName={ getPresetName }
									onSelectBlock={ onSelectBlock }
								/>
							) ) }
						</ul>
					</div>
				);
			} );

	return (
		<section
			className="block-editor-style-inspector"
			aria-label={ sprintf(
				/* translators: %s: block title, e.g. "Paragraph". */
				__( 'Styles of %s' ),
				blockTitle
			) }
		>
			<header className="block-editor-style-inspector__header">
				<Text
					variant="body-md"
					render={ <h2 /> }
					className="block-editor-style-inspector__title"
				>
					{ showAll ? __( 'All styles' ) : __( 'Customized styles' ) }
				</Text>
				<Button
					className="block-editor-style-inspector__show-all"
					size="small"
					variant="tertiary"
					onClick={ () => setShowAll( ! showAll ) }
				>
					{ showAll ? __( 'Show customized' ) : __( 'Show all' ) }
				</Button>
				{ onClose && (
					<Button
						size="small"
						icon={ closeSmall }
						label={ __( 'Close' ) }
						onClick={ onClose }
					/>
				) }
			</header>

			{ ! clientId && (
				<p className="block-editor-style-inspector__hint">
					{ __(
						'Select a block to see the styles it uses and where each one comes from.'
					) }
				</p>
			) }

			{ isCurrent && groupElements.some( Boolean ) && groupElements }
			{ isCurrent && ! groupElements.some( Boolean ) && (
				<p className="block-editor-style-inspector__hint">
					{ __(
						'Nothing on this block has been customized. It uses the theme’s styles.'
					) }
				</p>
			) }
		</section>
	);
}
