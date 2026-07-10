/**
 * WordPress dependencies
 */
import { getResolvedValue } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { getValueFromObjectPath } from '../../utils/object';
import { getVariationStylesWithRefValues } from '../../hooks/block-style-variation';

// Inlined from `hooks/block-style-state.js` to keep this builder free of that
// module's dependency chain so it stays pure and easy to test.
const DEFAULT_STATE_VALUE = 'default';

// Whether the selected block style state is the default (no pseudo/viewport).
function isDefaultBlockStyleState( selectedState ) {
	const viewport = selectedState?.viewport;
	const pseudo = selectedState?.pseudo;
	return (
		( ! viewport || viewport === DEFAULT_STATE_VALUE ) &&
		( ! pseudo || pseudo === DEFAULT_STATE_VALUE )
	);
}

// Object path for the selected state's styles: `[ viewport, pseudo ]` with
// default segments removed. Mirrors `getStyleForState` in
// `hooks/block-style-state.js`.
function getStyleStatePath( selectedState ) {
	if ( isDefaultBlockStyleState( selectedState ) ) {
		return [];
	}
	return [ selectedState.viewport, selectedState.pseudo ].filter(
		( state ) => state && state !== DEFAULT_STATE_VALUE
	);
}

// State-scoped sub-style for the selected state, or the style itself for the
// default state.
function getStyleForState( style, selectedState ) {
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
const EMPTY_INHERITANCE = Object.freeze( { value: {}, sources: {} } );

// Source descriptors per inheritance layer. `layer` identifies which layer
// supplied a leaf and drives inherited-value detection.
const SOURCE_DESCRIPTORS = {
	root: { layer: 'root' },
	block: { layer: 'block' },
	blockVariation: { layer: 'blockVariation' },
};

function createSourceDescriptor( type ) {
	const descriptor = SOURCE_DESCRIPTORS[ type ];
	if ( ! descriptor ) {
		return null;
	}
	return { ...descriptor };
}

function createContribution( styles, source ) {
	if ( ! styles || ! source ) {
		return null;
	}
	return { styles, source };
}

function getPathKey( path ) {
	return path.join( '.' );
}

// Clone the descriptor so source-map entries can diverge as paths differ.
function getSourceForPath( source, path ) {
	return {
		...source,
		path: [ ...path ],
	};
}

// Explicit-empty values do not contribute at their layer, allowing
// lower-precedence layers to surface instead. `0`, `'0'`, `false`, and `NaN`
// remain valid user-facing values.
function isExplicitEmpty( value ) {
	if ( value === '' || value === null ) {
		return true;
	}
	if (
		typeof value === 'object' &&
		! Array.isArray( value ) &&
		Object.keys( value ).length === 0
	) {
		return true;
	}
	return false;
}

function isRefObject( value ) {
	return (
		value !== null &&
		typeof value === 'object' &&
		! Array.isArray( value ) &&
		typeof value.ref === 'string'
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
 * @param {Object} layer Raw styles layer.
 * @return {Object|null} Root-scope contribution, or `null` when the layer is empty.
 */
function pickLayerRootContribution( layer ) {
	if ( ! layer || typeof layer !== 'object' || Array.isArray( layer ) ) {
		return null;
	}
	const contribution = {};
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

/**
 * Deep-merge `source` into `target`:
 * - Plain objects recurse.
 * - `{ ref }` envelopes at source are resolved against `globalStyles` and
 *   merged in place of the envelope.
 * - Arrays, primitives, and null replace wholesale.
 * - Explicit-empty source leaves (`''`, `null`, `{}`) are dropped, preserving
 *   the target's existing value.
 *
 * Mutates and returns `target`; does not mutate `source`.
 *
 * @param {Object} target
 * @param {Object} source
 * @param {Object} globalStyles
 * @param {Object} sourceMetadata
 * @param {Object} sources
 * @param {Array}  path
 * @return {Object} The mutated `target`.
 */
function deepMergeDroppingEmpties(
	target,
	source,
	globalStyles,
	sourceMetadata,
	sources,
	path = []
) {
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
			if ( resolved === undefined || resolved === null ) {
				continue;
			}
			sourceValue = resolved;
		}
		const nextPath = [ ...path, key ];
		if (
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
			target[ key ] = sourceValue;
			if ( sourceMetadata && sources ) {
				sources[ getPathKey( nextPath ) ] = getSourceForPath(
					sourceMetadata,
					nextPath
				);
			}
		}
	}
	return target;
}

// State-scoped slice of a layer-shaped object for the selected state,
// guarding against nullish inputs.
function getStateSlice( layerObject, selectedState ) {
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
function isNonCascadingRootPath( pathKey ) {
	if ( pathKey.startsWith( 'elements.' ) ) {
		return false;
	}
	return NON_CASCADING_ROOT_PREFIXES.some(
		( prefix ) => pathKey === prefix || pathKey.startsWith( `${ prefix }.` )
	);
}

// Delete a leaf at `pathSegments` from `target`, pruning any parent objects
// left empty by the removal.
function deleteAtPath( target, pathSegments ) {
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
function dropNonCascadingRootLeaves( value, sources ) {
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
function resolveThemeFileBackgroundImage( value, globalStyles, links ) {
	const image = value?.background?.backgroundImage;
	if ( ! image ) {
		return;
	}
	const resolved = getResolvedValue( image, {
		...globalStyles,
		_links: links,
	} );
	if ( resolved !== undefined ) {
		value.background.backgroundImage = resolved;
	}
}

/**
 * Internal, uncached merge. Computes the merged Global Styles payload and a
 * source map describing which Global Styles layer supplied each winning leaf.
 * `resolveStyles` is the public, memoized entry point.
 *
 * @param {Object}  args
 * @param {string}  args.blockName       Block name (e.g. `core/heading`).
 * @param {?string} [args.ownVariation]  Active block style variation slug, or null.
 * @param {Object}  [args.globalStyles]  The `settings[ globalStylesDataKey ]` payload.
 * @param {?Object} [args.selectedState] Selected block style state, or null for the default state.
 * @param {?Object} [args._links]        Theme-file links (`settings[ globalStylesLinksDataKey ]`), used to resolve theme-file pointers.
 * @return {{ value: Object, sources: Object }} Merged panel-scoped payload and source map.
 */
function computeResolvedStyles( {
	blockName,
	ownVariation = null,
	globalStyles,
	selectedState = null,
	_links = null,
} = {} ) {
	if ( ! globalStyles || ! globalStyles.styles ) {
		return EMPTY_INHERITANCE;
	}
	if ( ! blockName ) {
		return EMPTY_INHERITANCE;
	}

	const { styles } = globalStyles;

	const root = styles;
	const block = styles.blocks?.[ blockName ] ?? null;
	// Variation layer is pre-resolved for refs via the production helper.
	const variation = ownVariation
		? getVariationStylesWithRefValues(
				globalStyles,
				blockName,
				ownVariation
		  ) ?? null
		: null;

	// Layers ordered low to high precedence: root defaults, the block's own
	// defaults, then the active block style variation. Each layer's `elements`
	// sub-tree is preserved as a passthrough so panels can read element styles
	// (e.g. `inheritedValue.elements.link`).
	const contributions = [
		createContribution(
			pickLayerRootContribution( root ),
			createSourceDescriptor( 'root' )
		),
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

	const filteredContributions = contributions.filter( Boolean );

	if ( filteredContributions.length === 0 ) {
		return EMPTY_INHERITANCE;
	}

	const sources = {};
	const value = filteredContributions.reduce(
		( mergedValue, contribution ) =>
			deepMergeDroppingEmpties(
				mergedValue,
				contribution.styles,
				globalStyles,
				contribution.source,
				sources
			),
		{}
	);

	// Root-level non-cascading values do not reach the block; drop them from
	// value and sources together. Then resolve theme-file image pointers so
	// consumers receive fully-resolved values.
	dropNonCascadingRootLeaves( value, sources );
	resolveThemeFileBackgroundImage( value, globalStyles, _links );

	return { value, sources };
}

// Shared memo for `resolveStyles`, keyed by Global Styles object identity and
// a `(blockName, ownVariation, selectedState)` composite.
const memo = new WeakMap();

/**
 * Public entry point. Builds the merged Global Styles payload and source map
 * for a block (see `computeResolvedStyles` for the argument shape), memoized by
 * Global Styles object identity and a composite of the remaining arguments.
 *
 * @param {Object} args
 * @return {{ value: Object, sources: Object }} Merged panel-scoped payload and source map; may be a cache hit.
 */
export function resolveStyles( args ) {
	const globalStyles = args?.globalStyles;
	if ( ! globalStyles || typeof globalStyles !== 'object' ) {
		return computeResolvedStyles( args );
	}
	let inner = memo.get( globalStyles );
	if ( ! inner ) {
		inner = new Map();
		memo.set( globalStyles, inner );
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
		return inner.get( key );
	}
	const result = computeResolvedStyles( args );
	inner.set( key, result );
	return result;
}

// Internal helpers exported for unit tests only — not re-exported from the
// package root.
export const privateHelpers = {
	isExplicitEmpty,
	isRefObject,
	pickLayerRootContribution,
	deepMergeDroppingEmpties,
};
