/**
 * Internal dependencies
 */
import { getValueFromObjectPath } from '../../utils/object';
import { getVariationStylesWithRefValues } from '../../hooks/block-style-variation';

/**
 * Default block-style-state value. Kept in sync with
 * `hooks/block-style-state.js`; inlined here (rather than imported) to keep
 * this builder free of that module's heavy transitive dependency chain so it
 * stays pure and isolated-testable.
 */
const DEFAULT_STATE_VALUE = 'default';

/**
 * Whether the selected block style state is the default (no pseudo/viewport).
 *
 * @param {?Object} selectedState Selected block style state.
 * @return {boolean} Whether the default state is selected.
 */
function isDefaultBlockStyleState( selectedState ) {
	const viewport = selectedState?.viewport;
	const pseudo = selectedState?.pseudo;
	return (
		( ! viewport || viewport === DEFAULT_STATE_VALUE ) &&
		( ! pseudo || pseudo === DEFAULT_STATE_VALUE )
	);
}

/**
 * Resolve the object path for the selected block style state. Mirrors
 * `getStyleForState` in `hooks/block-style-state.js`: `[ viewport, pseudo ]`
 * with default segments removed.
 *
 * @param {?Object} selectedState Selected block style state.
 * @return {string[]} Object path for the state styles.
 */
function getStyleStatePath( selectedState ) {
	if ( isDefaultBlockStyleState( selectedState ) ) {
		return [];
	}
	return [ selectedState.viewport, selectedState.pseudo ].filter(
		( state ) => state && state !== DEFAULT_STATE_VALUE
	);
}

/**
 * Return the state-scoped sub-style for the selected state, or the style
 * itself for the default state.
 *
 * @param {?Object} style         Style object.
 * @param {?Object} selectedState Selected block style state.
 * @return {*} State-scoped style value.
 */
function getStyleForState( style, selectedState ) {
	const path = getStyleStatePath( selectedState );
	if ( ! path.length ) {
		return style;
	}
	return getValueFromObjectPath( style, path );
}

/**
 * Keys on a `styles.*` layer that describe tree structure rather than the
 * block's own leaf contributions. They are excluded from the per-layer
 * pick pass before the merge.
 */
const TREE_STRUCTURAL_KEYS = new Set( [ 'blocks', 'variations', 'css' ] );

/**
 * Empty inheritance data returned before Global Styles payloads settle.
 */
const EMPTY_INHERITANCE = Object.freeze( { value: {}, sources: {} } );

/**
 * Source breadcrumb part identifiers for each Global Styles inheritance layer.
 */
const SOURCE_BREADCRUMB_PARTS = {
	styles: 'styles',
	elements: 'elements',
	blocks: 'blocks',
	blockName: 'blockName',
	variations: 'variations',
	variationName: 'variationName',
};

/**
 * Breadcrumb source descriptors for each Global Styles inheritance layer.
 */
const SOURCE_DESCRIPTORS = {
	root: {
		breadcrumb: [ SOURCE_BREADCRUMB_PARTS.styles ],
		layer: 'root',
	},
	rootElement: {
		breadcrumb: [
			SOURCE_BREADCRUMB_PARTS.styles,
			SOURCE_BREADCRUMB_PARTS.elements,
		],
		layer: 'rootElement',
	},
	block: {
		breadcrumb: [
			SOURCE_BREADCRUMB_PARTS.styles,
			SOURCE_BREADCRUMB_PARTS.blocks,
			SOURCE_BREADCRUMB_PARTS.blockName,
		],
		layer: 'block',
	},
	blockElement: {
		breadcrumb: [
			SOURCE_BREADCRUMB_PARTS.styles,
			SOURCE_BREADCRUMB_PARTS.blocks,
			SOURCE_BREADCRUMB_PARTS.blockName,
			SOURCE_BREADCRUMB_PARTS.elements,
		],
		layer: 'blockElement',
	},
	blockVariation: {
		breadcrumb: [
			SOURCE_BREADCRUMB_PARTS.styles,
			SOURCE_BREADCRUMB_PARTS.blocks,
			SOURCE_BREADCRUMB_PARTS.blockName,
			SOURCE_BREADCRUMB_PARTS.variations,
			SOURCE_BREADCRUMB_PARTS.variationName,
		],
		layer: 'blockVariation',
	},
	blockVariationElement: {
		breadcrumb: [
			SOURCE_BREADCRUMB_PARTS.styles,
			SOURCE_BREADCRUMB_PARTS.blocks,
			SOURCE_BREADCRUMB_PARTS.blockName,
			SOURCE_BREADCRUMB_PARTS.variations,
			SOURCE_BREADCRUMB_PARTS.variationName,
			SOURCE_BREADCRUMB_PARTS.elements,
		],
		layer: 'blockVariationElement',
	},
};

function createSourceDescriptor(
	type,
	{ blockName, variation, element, blockStyles } = {}
) {
	const descriptor = SOURCE_DESCRIPTORS[ type ];
	if ( ! descriptor ) {
		return null;
	}
	return {
		...descriptor,
		breadcrumb: element
			? [ ...descriptor.breadcrumb, element ]
			: [ ...descriptor.breadcrumb ],
		blockName: blockName ?? null,
		variation: variation ?? null,
		variationTitle:
			blockStyles?.find( ( style ) => style.name === variation )?.label ??
			null,
		element: element ?? null,
	};
}

/**
 * Create a merge contribution with the source metadata that applies to all
 * leaves in its style object.
 *
 * @param {?Object} styles Style contribution for one inheritance layer.
 * @param {?Object} source Source metadata for the contribution.
 * @return {?Object} Merge contribution, or null when styles/source is empty.
 */
function createContribution( styles, source ) {
	if ( ! styles || ! source ) {
		return null;
	}
	return { styles, source };
}

/**
 * Build a dot-path key for a style leaf.
 *
 * @param {Array} path Path segments.
 * @return {string} Dot path.
 */
function getPathKey( path ) {
	return path.join( '.' );
}

/**
 * Clone source metadata before storing it so source map entries can safely
 * diverge as paths differ.
 *
 * @param {Object} source Source descriptor.
 * @param {Array}  path   Leaf path.
 * @return {Object} Stored source descriptor.
 */
function getSourceForPath( source, path ) {
	const breadcrumb = [ ...source.breadcrumb ];
	const [ maybeElementsKey, maybeElement ] = path;
	if ( maybeElementsKey === 'elements' && maybeElement ) {
		breadcrumb.push( SOURCE_BREADCRUMB_PARTS.elements, maybeElement );
	}
	return {
		...source,
		breadcrumb,
		path: [ ...path ],
	};
}

/**
 * Explicit-empty values do not contribute at their layer, allowing
 * lower-precedence layers to surface instead.
 *
 * `0`, `'0'`, `false`, and `NaN` remain valid user-facing values.
 *
 * @param {*} v
 * @return {boolean} Whether the value should be dropped from the merge.
 */
function isExplicitEmpty( v ) {
	if ( v === '' || v === null ) {
		return true;
	}
	if (
		v !== null &&
		typeof v === 'object' &&
		! Array.isArray( v ) &&
		Object.keys( v ).length === 0
	) {
		return true;
	}
	return false;
}

/**
 * Check whether a value is a `{ ref: '...' }` reference envelope.
 *
 * @param {*} v
 * @return {boolean} Whether `v` is a `{ ref: string }` envelope.
 */
function isRefObject( v ) {
	return (
		v !== null &&
		typeof v === 'object' &&
		! Array.isArray( v ) &&
		typeof v.ref === 'string'
	);
}

/**
 * Pick the root-scope contribution from a single `styles` layer: plain
 * leaves and sub-trees that are not tree-structural and not the
 * `elements` sub-tree itself. The `elements` sub-tree IS preserved as a
 * passthrough on the final payload so panels that read e.g.
 * `inheritedValue.elements.link.color.text` keep working; it just does
 * not participate in the element-scoped fold.
 *
 * Does not recurse or clone; the returned contribution references the
 * original layer's sub-objects. The deep-merge step copies them into a
 * fresh tree and resolves `{ ref }` envelopes inline as it goes.
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
 * Pick the element-scope contribution from `layer.elements[element]`.
 * Returns a plain-object "layer-shaped" contribution — same top-level
 * keys as a normal layer — so it can be merged in the same pipeline as
 * root-scope contributions, inheriting deep-merge semantics.
 *
 * @param {Object}  layer   Raw styles layer.
 * @param {?string} element Element tag (e.g. `h2`, `link`).
 * @return {Object|null} Element-scope contribution, or `null` when no leaves contribute.
 */
function pickLayerElementContribution( layer, element ) {
	if ( ! element || ! layer || ! layer.elements ) {
		return null;
	}
	const folded = layer.elements[ element ];
	if ( ! folded || typeof folded !== 'object' || Array.isArray( folded ) ) {
		return null;
	}
	const contribution = {};
	for ( const key of Object.keys( folded ) ) {
		if ( TREE_STRUCTURAL_KEYS.has( key ) || key === 'elements' ) {
			continue;
		}
		if ( isExplicitEmpty( folded[ key ] ) ) {
			continue;
		}
		contribution[ key ] = folded[ key ];
	}
	return Object.keys( contribution ).length === 0 ? null : contribution;
}

/**
 * Deep-merge `source` into `target` with the following rules:
 * - Plain objects recurse.
 * - `{ ref }` envelopes encountered at source are resolved against
 *   `globalStyles` and merged in place of the envelope.
 * - Arrays, primitives, and null replace wholesale.
 * - Explicit-empty source leaves (`''`, `null`, `{}`) are dropped — the
 *   target's existing value is preserved.
 *
 * Mutates and returns `target`. Does not mutate `source`.
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
		let sVal = source[ key ];
		if ( isExplicitEmpty( sVal ) ) {
			continue;
		}
		if ( isRefObject( sVal ) ) {
			if ( sVal.ref.trim() === '' ) {
				continue;
			}
			const resolved = getValueFromObjectPath( globalStyles, sVal.ref );
			if ( resolved === undefined || resolved === null ) {
				continue;
			}
			sVal = resolved;
		}
		const nextPath = [ ...path, key ];
		if (
			sVal !== null &&
			typeof sVal === 'object' &&
			! Array.isArray( sVal ) &&
			! isRefObject( sVal )
		) {
			const existing =
				target[ key ] &&
				typeof target[ key ] === 'object' &&
				! Array.isArray( target[ key ] )
					? target[ key ]
					: {};
			target[ key ] = deepMergeDroppingEmpties(
				{ ...existing },
				sVal,
				globalStyles,
				sourceMetadata,
				sources,
				nextPath
			);
		} else {
			target[ key ] = sVal;
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

/**
 * Read a layer's `elements[ element ]` sub-object, guarding against
 * non-object values.
 *
 * @param {?Object} layer   Raw styles layer.
 * @param {?string} element Element tag (e.g. `h2`, `link`, `button`).
 * @return {Object|null} The element sub-object, or `null`.
 */
function getElementObject( layer, element ) {
	if ( ! layer || ! element ) {
		return null;
	}
	const el = layer.elements?.[ element ];
	return el && typeof el === 'object' && ! Array.isArray( el ) ? el : null;
}

/**
 * Resolve the state-scoped slice of a layer-shaped object for the selected
 * block style state, guarding against nullish inputs.
 *
 * @param {?Object} layerObject   Layer-shaped object (root- or element-scope).
 * @param {Object}  selectedState Selected block style state.
 * @return {Object|null} The state slice, or `null`.
 */
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
 * Compute the merged Global Styles payload for an inspector panel to use as
 * its `inheritedValue`.
 *
 * Layers are merged from low to high precedence: root styles, root element
 * styles, block styles, block element styles, block variation styles, and
 * block variation element styles.
 *
 * Preset strings are left raw so consumer panels can decode them at display
 * time and still access preset slugs for selector controls.
 *
 * @param {Object}  args
 * @param {string}  args.blockName       Block name (e.g. `core/heading`).
 * @param {?string} [args.element]       Element tag to fold (e.g. `h2`, `link`), or null for block-scope only.
 * @param {?string} [args.ownVariation]  Active block style variation slug, or null.
 * @param {Object}  [args.globalStyles]  The `settings[ globalStylesDataKey ]` payload.
 * @param {?Object} [args.selectedState] Selected block style state, or null for the default state.
 * @return {Object} Merged panel-scoped payload.
 */
export function buildInheritedValue( args = {} ) {
	return buildInheritedValueWithSources( args ).value;
}

/**
 * Compute the merged Global Styles payload and a source map describing which
 * Global Styles layer supplied each winning leaf.
 *
 * @param {Object}  args
 * @param {string}  args.blockName       Block name (e.g. `core/heading`).
 * @param {?string} [args.element]       Element tag to fold (e.g. `h2`, `link`), or null for block-scope only.
 * @param {?string} [args.ownVariation]  Active block style variation slug, or null.
 * @param {Object}  [args.globalStyles]  The `settings[ globalStylesDataKey ]` payload.
 * @param {Array}   [args.blockStyles]   Registered styles for the block type.
 * @param {?Object} [args.selectedState] Selected block style state, or null for the default state.
 * @return {{ value: Object, sources: Object }} Merged panel-scoped payload and source map.
 */
export function buildInheritedValueWithSources( {
	blockName,
	element = null,
	ownVariation = null,
	globalStyles,
	blockStyles = [],
	selectedState = null,
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

	// Layers are ordered from low to high precedence. Root-scope and
	// element-scope contributions are merged separately so element
	// overrides can replace specific leaves without dropping sibling values.
	const contributions = [
		createContribution(
			pickLayerRootContribution( root ),
			createSourceDescriptor( 'root' )
		),
		element
			? createContribution(
					pickLayerElementContribution( root, element ),
					createSourceDescriptor( 'rootElement', { element } )
			  )
			: null,
		block
			? createContribution(
					pickLayerRootContribution( block ),
					createSourceDescriptor( 'block', { blockName } )
			  )
			: null,
		block && element
			? createContribution(
					pickLayerElementContribution( block, element ),
					createSourceDescriptor( 'blockElement', {
						blockName,
						element,
					} )
			  )
			: null,
		variation
			? createContribution(
					pickLayerRootContribution( variation ),
					createSourceDescriptor( 'blockVariation', {
						blockName,
						variation: ownVariation,
						blockStyles,
					} )
			  )
			: null,
		variation && element
			? createContribution(
					pickLayerElementContribution( variation, element ),
					createSourceDescriptor( 'blockVariationElement', {
						blockName,
						variation: ownVariation,
						blockStyles,
						element,
					} )
			  )
			: null,
	];

	// When a non-default block style state (pseudo and/or responsive
	// viewport) is selected, layer the state-scoped slice of each Global
	// Styles layer on top of the base contributions. This mirrors the CSS
	// cascade: a block's `:hover` / responsive styles inherit from its base
	// styles, so the inherited placeholder for a selected state is the base
	// inherited value with any state-specific Global Styles values layered
	// over it. State slices are appended after all base layers, preserving
	// the same low-to-high scope ordering, so state values win over base.
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
							getStateSlice(
								getElementObject( root, element ),
								selectedState
							)
						),
						createSourceDescriptor( 'rootElement', { element } )
				  )
				: null,
			block
				? createContribution(
						pickLayerRootContribution(
							getStateSlice( block, selectedState )
						),
						createSourceDescriptor( 'block', { blockName } )
				  )
				: null,
			block && element
				? createContribution(
						pickLayerRootContribution(
							getStateSlice(
								getElementObject( block, element ),
								selectedState
							)
						),
						createSourceDescriptor( 'blockElement', {
							blockName,
							element,
						} )
				  )
				: null,
			variation
				? createContribution(
						pickLayerRootContribution(
							getStateSlice( variation, selectedState )
						),
						createSourceDescriptor( 'blockVariation', {
							blockName,
							variation: ownVariation,
							blockStyles,
						} )
				  )
				: null,
			variation && element
				? createContribution(
						pickLayerRootContribution(
							getStateSlice(
								getElementObject( variation, element ),
								selectedState
							)
						),
						createSourceDescriptor( 'blockVariationElement', {
							blockName,
							variation: ownVariation,
							blockStyles,
							element,
						} )
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
		( acc, contribution ) =>
			deepMergeDroppingEmpties(
				acc,
				contribution.styles,
				globalStyles,
				contribution.source,
				sources
			),
		{}
	);

	return { value, sources };
}

/**
 * Shared memo for `buildInheritedValue`, keyed by Global Styles object
 * identity and a `(blockName, element, ownVariation)` composite.
 *
 * @type {WeakMap<object, Map<string, Object>>}
 */
const memo = new WeakMap();

/**
 * Memoized variant of `buildInheritedValueWithSources`. Same signature.
 *
 * @param {Object} args
 * @return {{ value: Object, sources: Object }} Merged panel-scoped payload and source map; may be a cache hit.
 */
export function buildInheritedValueMemoized( args ) {
	return buildInheritedValueWithSourcesMemoized( args ).value;
}

/**
 * Memoized variant of `buildInheritedValueWithSources`. Same signature.
 *
 * @param {Object} args
 * @return {{ value: Object, sources: Object }} Merged panel-scoped payload and source map; may be a cache hit.
 */
export function buildInheritedValueWithSourcesMemoized( args ) {
	const gs = args?.globalStyles;
	if ( ! gs || typeof gs !== 'object' ) {
		return buildInheritedValueWithSources( args );
	}
	let inner = memo.get( gs );
	if ( ! inner ) {
		inner = new Map();
		memo.set( gs, inner );
	}
	const blockStylesKey = ( args.blockStyles || [] )
		.map( ( { name, label } ) => `${ name }:${ label }` )
		.join( ',' );
	const selectedStateKey = args.selectedState
		? `${ args.selectedState.viewport ?? '' }:${
				args.selectedState.pseudo ?? ''
		  }`
		: '';
	const key =
		( args.blockName || '' ) +
		'\u0001' +
		( args.element || '' ) +
		'\u0001' +
		( args.ownVariation || '' ) +
		'\u0001' +
		blockStylesKey +
		'\u0001' +
		selectedStateKey;
	if ( inner.has( key ) ) {
		return inner.get( key );
	}
	const result = buildInheritedValueWithSources( args );
	inner.set( key, result );
	return result;
}

// Internals exported for tests only — not re-exported from the package
// root.
export const __unstable = {
	isExplicitEmpty,
	isRefObject,
	pickLayerRootContribution,
	pickLayerElementContribution,
	deepMergeDroppingEmpties,
};
