/**
 * Internal dependencies
 */
import { getResolvedValue } from './utils/common';
import { getValueFromObjectPath } from './utils/object';
import { getVariationStylesWithRefValues } from './variation';

type StyleTree = Record< string, any >;

interface SelectedState {
	viewport?: string;
	pseudo?: string;
}

interface SourceDescriptor {
	layer: string;
}

interface ResolvedStyle {
	value: StyleTree;
	sources: Record< string, SourceDescriptor >;
}

interface ResolveStyleArgs {
	blockName?: string | null;
	// Slug of the active block style variation, if any. Its styles are resolved
	// against `globalStyles` internally and folded in as the highest layer.
	ownVariation?: string | null;
	globalStyles?: { styles?: StyleTree } | null;
	selectedState?: SelectedState | null;
	_links?: Record< string, any > | null;
}

const DEFAULT_STATE_VALUE = 'default';

function isDefaultBlockStyleState( selectedState?: SelectedState | null ) {
	const viewport = selectedState?.viewport;
	const pseudo = selectedState?.pseudo;
	return (
		( ! viewport || viewport === DEFAULT_STATE_VALUE ) &&
		( ! pseudo || pseudo === DEFAULT_STATE_VALUE )
	);
}

function getStyleStatePath( selectedState: SelectedState ) {
	if ( isDefaultBlockStyleState( selectedState ) ) {
		return [];
	}
	return [ selectedState.viewport, selectedState.pseudo ].filter(
		( state ): state is string => !! state && state !== DEFAULT_STATE_VALUE
	);
}

function getStyleForState( style: StyleTree, selectedState: SelectedState ) {
	const path = getStyleStatePath( selectedState );
	if ( ! path.length ) {
		return style;
	}
	return getValueFromObjectPath( style, path );
}

// Keys on a `styles.*` layer that describe tree structure rather than the
// block's own leaf contributions; excluded from the per-layer pick pass.
const TREE_STRUCTURAL_KEYS = new Set( [ 'blocks', 'variations', 'css' ] );

// Empty inheritance data returned before Global Styles payloads settle.
const EMPTY_INHERITANCE: ResolvedStyle = Object.freeze( {
	value: {},
	sources: {},
} );

// Source descriptors per inheritance layer. `layer` identifies which layer
// supplied a leaf and drives inherited-value detection.
const SOURCE_DESCRIPTORS: Record< string, SourceDescriptor > = {
	root: { layer: 'root' },
	element: { layer: 'element' },
	block: { layer: 'block' },
	blockVariation: { layer: 'blockVariation' },
};

// Blocks whose canvas rendering is driven by a Global Styles *element*
// selector (e.g. `.wp-element-button`, `h1`–`h6`) rather than the block's own
// class. For these, the matching root-level `styles.elements[ element ]` layer
// is folded in as its own inheritance layer.
const BLOCK_TO_ROOT_ELEMENT: Record< string, string > = {
	'core/button': 'button',
	'core/heading': 'heading',
};

function createSourceDescriptor( type: string ): SourceDescriptor | null {
	const descriptor = SOURCE_DESCRIPTORS[ type ];
	if ( ! descriptor ) {
		return null;
	}
	return { ...descriptor };
}

interface Contribution {
	styles: StyleTree;
	source: SourceDescriptor;
}

function createContribution(
	styles: StyleTree | null,
	source: SourceDescriptor | null
): Contribution | null {
	if ( ! styles || ! source ) {
		return null;
	}
	return { styles, source };
}

function getPathKey( path: string[] ) {
	return path.join( '.' );
}

// Clone the descriptor so each source-map entry is its own object.
function getSourceForPath( source: SourceDescriptor ): SourceDescriptor {
	return { ...source };
}

// Explicit-empty values do not contribute at their layer, allowing
// lower-precedence layers to surface instead. `0`, `'0'`, `false`, and `NaN`
// remain valid user-facing values.
function isExplicitEmpty( value: unknown ) {
	if ( value === '' || value === null ) {
		return true;
	}
	if (
		typeof value === 'object' &&
		! Array.isArray( value ) &&
		Object.keys( value as object ).length === 0
	) {
		return true;
	}
	return false;
}

function isRefObject( value: unknown ): value is { ref: string } {
	return (
		value !== null &&
		typeof value === 'object' &&
		! Array.isArray( value ) &&
		typeof ( value as { ref?: unknown } ).ref === 'string'
	);
}

/**
 * Pick the root-scope contribution from a single `styles` layer: plain leaves
 * and sub-trees that are not tree-structural and not the `elements` sub-tree
 * itself. The `elements` sub-tree IS preserved as a passthrough on the final
 * payload so panels that read e.g. `inheritedValue.elements.link.color.text`
 * keep working.
 *
 * Does not recurse or clone; the returned contribution references the original
 * layer's sub-objects. The deep-merge step copies them into a fresh tree and
 * resolves `{ ref }` envelopes inline as it goes.
 *
 * @param layer Raw styles layer.
 * @return Root-scope contribution, or `null` when the layer is empty.
 */
function pickLayerRootContribution(
	layer: StyleTree | null
): StyleTree | null {
	if ( ! layer || typeof layer !== 'object' || Array.isArray( layer ) ) {
		return null;
	}
	const contribution: StyleTree = {};
	for ( const key of Object.keys( layer ) ) {
		if ( TREE_STRUCTURAL_KEYS.has( key ) ) {
			continue;
		}
		if ( key === 'elements' ) {
			if ( layer.elements && typeof layer.elements === 'object' ) {
				contribution.elements = layer.elements;
			}
			continue;
		}
		if ( isExplicitEmpty( layer[ key ] ) ) {
			continue;
		}
		contribution[ key ] = layer[ key ];
	}
	return Object.keys( contribution ).length === 0 ? null : contribution;
}

// Object valued leaves that are a single atomic definition and must not be
// deep-merged. Used to mirror the `backgroundImage` exception in the Global
// Styles engine's `mergeGlobalStyles`.
const ATOMIC_OBJECT_KEYS = new Set( [ 'backgroundImage' ] );

/**
 * Deep-merge `source` into `target`:
 * - Plain objects recurse.
 * - `{ ref }` envelopes at source are resolved against `globalStyles` and
 *   merged in place of the envelope.
 * - Arrays, primitives, null, and atomic-object leaves (`ATOMIC_OBJECT_KEYS`)
 *   replace wholesale.
 * - Explicit-empty source leaves (`''`, `null`, `{}`) are dropped, preserving
 *   the target's existing value.
 *
 * Mutates and returns `target`; does not mutate `source`.
 *
 * @param target
 * @param source
 * @param globalStyles
 * @param sourceMetadata
 * @param sources
 * @param path
 * @return The mutated `target`.
 */
function deepMergeDroppingEmpties(
	target: StyleTree,
	source: StyleTree,
	globalStyles: StyleTree,
	sourceMetadata?: SourceDescriptor,
	sources?: Record< string, SourceDescriptor >,
	path: string[] = []
): StyleTree {
	if ( ! source || typeof source !== 'object' || Array.isArray( source ) ) {
		return target;
	}
	for ( const key of Object.keys( source ) ) {
		let sourceValue = source[ key ];
		if ( isExplicitEmpty( sourceValue ) ) {
			continue;
		}
		if ( isRefObject( sourceValue ) ) {
			if ( sourceValue.ref.trim() === '' ) {
				continue;
			}
			const resolved = getValueFromObjectPath(
				globalStyles,
				sourceValue.ref
			);
			if (
				resolved === undefined ||
				resolved === null ||
				isRefObject( resolved )
			) {
				continue;
			}
			sourceValue = resolved;
		}
		const nextPath = [ ...path, key ];
		if (
			! ATOMIC_OBJECT_KEYS.has( key ) &&
			sourceValue !== null &&
			typeof sourceValue === 'object' &&
			! Array.isArray( sourceValue ) &&
			! isRefObject( sourceValue )
		) {
			const existing =
				target[ key ] &&
				typeof target[ key ] === 'object' &&
				! Array.isArray( target[ key ] )
					? target[ key ]
					: {};
			target[ key ] = deepMergeDroppingEmpties(
				{ ...existing },
				sourceValue,
				globalStyles,
				sourceMetadata,
				sources,
				nextPath
			);
		} else {
			target[ key ] =
				ATOMIC_OBJECT_KEYS.has( key ) &&
				sourceValue !== null &&
				typeof sourceValue === 'object' &&
				! Array.isArray( sourceValue )
					? { ...sourceValue }
					: sourceValue;
			if ( sourceMetadata && sources ) {
				sources[ getPathKey( nextPath ) ] =
					getSourceForPath( sourceMetadata );
			}
		}
	}
	return target;
}

function getStateSlice(
	layerObject: StyleTree | null,
	selectedState: SelectedState
): StyleTree | null {
	if ( ! layerObject ) {
		return null;
	}
	const slice = getStyleForState( layerObject, selectedState );
	return slice && typeof slice === 'object' && ! Array.isArray( slice )
		? slice
		: null;
}

/**
 * Root-level Global Styles for these property groups paint the root/layout
 * element only and do not cascade to a descendant block, so a root-sourced
 * leaf must not surface as the block's inherited value. Cascading properties
 * (typography, `color.text`) and the `elements.*` passthrough are kept.
 *
 * `color.background` / `color.gradient` are the background-specific leaves
 * under `color`; `color.text` deliberately stays.
 */
const NON_CASCADING_ROOT_PREFIXES = [
	'color.background',
	'color.gradient',
	'background',
	'spacing',
	'dimensions',
	'border',
	'shadow',
	'filter',
];

// Whether a leaf dot-path is a non-cascading property (see
// `NON_CASCADING_ROOT_PREFIXES`). The `elements.*` passthrough is exempt: its
// values are emitted onto their own global selectors and do reach the block.
function isNonCascadingRootPath( pathKey: string ) {
	if ( pathKey.startsWith( 'elements.' ) ) {
		return false;
	}
	return NON_CASCADING_ROOT_PREFIXES.some(
		( prefix ) => pathKey === prefix || pathKey.startsWith( `${ prefix }.` )
	);
}

// Delete a leaf at `pathSegments` from `target`, pruning any parent objects
// left empty by the removal.
function deleteAtPath( target: StyleTree, pathSegments: string[] ) {
	if ( ! target || typeof target !== 'object' ) {
		return;
	}
	const [ head, ...rest ] = pathSegments;
	if ( rest.length === 0 ) {
		delete target[ head ];
		return;
	}
	const child = target[ head ];
	if ( child && typeof child === 'object' ) {
		deleteAtPath( child, rest );
		if ( Object.keys( child ).length === 0 ) {
			delete target[ head ];
		}
	}
}

// Drop root-sourced non-cascading leaves from the merged value and its source
// map together, so an inspector control never surfaces a root value that does
// not actually reach the block. See `NON_CASCADING_ROOT_PREFIXES`.
function dropNonCascadingRootLeaves(
	value: StyleTree,
	sources: Record< string, SourceDescriptor >
) {
	for ( const pathKey of Object.keys( sources ) ) {
		if (
			sources[ pathKey ].layer === 'root' &&
			isNonCascadingRootPath( pathKey )
		) {
			deleteAtPath( value, pathKey.split( '.' ) );
			delete sources[ pathKey ];
		}
	}
}

// Resolve the inherited `background.backgroundImage` against the Global Styles
// tree and its theme-file links, so consumers receive a final image value.
// `{ ref }` envelopes are already resolved during the merge; this additionally
// resolves theme-file `.url` paths. The merge produces a fresh
// `backgroundImage` object, so resolving in place does not mutate store data.
function resolveThemeFileBackgroundImage(
	value: StyleTree,
	globalStyles: StyleTree,
	links: Record< string, any > | null
) {
	const image = value?.background?.backgroundImage;
	if ( ! image ) {
		return;
	}
	const resolved = getResolvedValue( image, {
		...globalStyles,
		_links: links ?? undefined,
	} );
	if ( resolved !== undefined ) {
		value.background.backgroundImage = resolved;
	}
}

/**
 * Internal, uncached merge. Computes the merged Global Styles payload and a
 * source map describing which Global Styles layer supplied each winning leaf.
 * `resolveStyle` is the public, memoized entry point.
 *
 * @param args
 * @param args.blockName     Block name (e.g. `core/heading`).
 * @param args.ownVariation  Slug of the active block style variation, or null.
 * @param args.globalStyles  The `settings[ globalStylesDataKey ]` payload, wrapped as `{ styles }`.
 * @param args.selectedState Selected block style state, or null for the default state.
 * @param args._links        Theme-file links, used to resolve theme-file pointers.
 * @return Merged panel-scoped payload and source map.
 */
function computeResolvedStyle( {
	blockName,
	ownVariation = null,
	globalStyles,
	selectedState = null,
	_links = null,
}: ResolveStyleArgs = {} ): ResolvedStyle {
	if ( ! globalStyles || ! globalStyles.styles ) {
		return EMPTY_INHERITANCE;
	}
	if ( ! blockName ) {
		return EMPTY_INHERITANCE;
	}

	const { styles } = globalStyles;

	const root = styles;
	const block = styles.blocks?.[ blockName ] ?? null;
	// For element-based blocks (e.g. `core/button`), the root-level element
	// styles paint the block on the canvas, so fold them in as a layer just
	// above the root defaults but below the block's own styles.
	const rootElement = BLOCK_TO_ROOT_ELEMENT[ blockName ] ?? null;
	const element = rootElement
		? styles.elements?.[ rootElement ] ?? null
		: null;
	// Resolve the active block style variation's styles (with `{ ref }`
	// envelopes resolved) against the Global Styles tree.
	const variation = ownVariation
		? getVariationStylesWithRefValues(
				globalStyles,
				blockName,
				ownVariation
		  ) ?? null
		: null;

	// Layers ordered low to high precedence: root defaults, the matching
	// root-level element styles (for element-based blocks), the block's own
	// defaults, then the active block style variation. Each layer's `elements`
	// sub-tree is preserved as a passthrough so panels can read element styles
	// (e.g. `inheritedValue.elements.link`).
	const contributions = [
		createContribution(
			pickLayerRootContribution( root ),
			createSourceDescriptor( 'root' )
		),
		element
			? createContribution(
					pickLayerRootContribution( element ),
					createSourceDescriptor( 'element' )
			  )
			: null,
		block
			? createContribution(
					pickLayerRootContribution( block ),
					createSourceDescriptor( 'block' )
			  )
			: null,
		variation
			? createContribution(
					pickLayerRootContribution( variation ),
					createSourceDescriptor( 'blockVariation' )
			  )
			: null,
	];

	// For a non-default state (pseudo and/or viewport), layer each layer's
	// state-scoped slice on top of the base contributions, mirroring the CSS
	// cascade: a block's `:hover`/responsive styles inherit from its base
	// styles. State slices are appended after all base layers, preserving the
	// same low-to-high scope ordering, so state values win over base.
	if ( selectedState && ! isDefaultBlockStyleState( selectedState ) ) {
		contributions.push(
			createContribution(
				pickLayerRootContribution(
					getStateSlice( root, selectedState )
				),
				createSourceDescriptor( 'root' )
			),
			element
				? createContribution(
						pickLayerRootContribution(
							getStateSlice( element, selectedState )
						),
						createSourceDescriptor( 'element' )
				  )
				: null,
			block
				? createContribution(
						pickLayerRootContribution(
							getStateSlice( block, selectedState )
						),
						createSourceDescriptor( 'block' )
				  )
				: null,
			variation
				? createContribution(
						pickLayerRootContribution(
							getStateSlice( variation, selectedState )
						),
						createSourceDescriptor( 'blockVariation' )
				  )
				: null
		);
	}

	const filteredContributions = contributions.filter(
		Boolean
	) as Contribution[];

	if ( filteredContributions.length === 0 ) {
		return EMPTY_INHERITANCE;
	}

	const sources: Record< string, SourceDescriptor > = {};
	const value = filteredContributions.reduce(
		( mergedValue, contribution ) =>
			deepMergeDroppingEmpties(
				mergedValue,
				contribution.styles,
				globalStyles,
				contribution.source,
				sources
			),
		{} as StyleTree
	);

	// Root-level non-cascading values do not reach the block; drop them from
	// value and sources together. Then resolve theme-file image pointers so
	// consumers receive fully-resolved values.
	dropNonCascadingRootLeaves( value, sources );
	resolveThemeFileBackgroundImage( value, globalStyles, _links );

	return { value, sources };
}

const NO_LINKS = {};

// Two-level memo: keyed by the raw Global Styles payload identity, then by the
// `_links` map identity, then by a `(blockName, ownVariation, selectedState)`
// string. Keying on both object identities means a change to either the styles
// payload or the theme-file links produces a fresh entry.
const memo = new WeakMap<
	object,
	WeakMap< object, Map< string, ResolvedStyle > >
>();

/**
 * Public, memoized entry point for `computeResolvedStyle`. The active
 * variation's styles are resolved internally from `ownVariation`.
 *
 * Panels for the same selection share one `globalStyles.styles` payload, so
 * keying on it (not the per-hook `{ styles }` wrapper) collapses them to a
 * single cascade merge.
 *
 * @param args
 * @return Merged panel-scoped payload and source map; may be a cache hit.
 */
export function resolveStyle( args: ResolveStyleArgs ): ResolvedStyle {
	const styleData = args?.globalStyles?.styles;
	if ( ! styleData || typeof styleData !== 'object' ) {
		return computeResolvedStyle( args );
	}
	let byLinks = memo.get( styleData );
	if ( ! byLinks ) {
		byLinks = new WeakMap();
		memo.set( styleData, byLinks );
	}
	const linksKey = args._links ?? NO_LINKS;
	let inner = byLinks.get( linksKey );
	if ( ! inner ) {
		inner = new Map();
		byLinks.set( linksKey, inner );
	}
	const selectedStateKey = args.selectedState
		? `${ args.selectedState.viewport ?? '' }:${
				args.selectedState.pseudo ?? ''
		  }`
		: '';
	const key =
		( args.blockName || '' ) +
		'\u0001' +
		( args.ownVariation || '' ) +
		'\u0001' +
		selectedStateKey;
	if ( inner.has( key ) ) {
		return inner.get( key ) as ResolvedStyle;
	}
	const result = computeResolvedStyle( args );
	inner.set( key, result );
	return result;
}

// Internal helpers exported for unit tests only — not part of the package's
// public or private API surface.
export const privateHelpers = {
	isExplicitEmpty,
	isRefObject,
	pickLayerRootContribution,
	deepMergeDroppingEmpties,
};
