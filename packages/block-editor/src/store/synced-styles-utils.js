/**
 * Maps style attribute names to the block attributes they cover.
 *
 * - `topLevel` lists root-level block attributes (e.g. `textColor`, `fontSize`)
 * - `styleKey`  is the sub-key inside the `style` attribute object (e.g. `style.color`)
 */
const STYLE_GROUP_MAP = {
	color: {
		topLevel: [ 'textColor', 'backgroundColor', 'gradient' ],
		styleKey: 'color',
	},
	typography: {
		topLevel: [ 'fontSize', 'fontFamily' ],
		styleKey: 'typography',
	},
	border: {
		topLevel: [ 'borderColor' ],
		styleKey: 'border',
	},
	spacing: {
		topLevel: [],
		styleKey: 'spacing',
	},
	shadow: {
		topLevel: [],
		styleKey: 'shadow',
	},
};

const ALL_SYNCED_TOP_LEVEL_KEYS = new Set(
	Object.values( STYLE_GROUP_MAP ).flatMap( ( g ) => g.topLevel )
);

const ALL_SYNCED_STYLE_KEYS = new Set(
	Object.values( STYLE_GROUP_MAP )
		.map( ( g ) => g.styleKey )
		.filter( Boolean )
);

/**
 * Splits an attributes object into two buckets: style attributes (which are
 * synced to siblings) and non-style attributes (which are not).
 *
 * Handles both top-level attributes (e.g. `textColor`) and sub-keys of the
 * nested `style` attribute object (e.g. `style.color`).
 *
 * @param {Object} attributes Changed block attributes.
 * @return {{ syncedAttributes: Object, unsyncedAttributes: Object }} Object with attributes split into synced and unsynced buckets.
 */
export function partitionAttributesByGroups( attributes ) {
	const synced = {};
	const unsynced = {};

	for ( const [ key, value ] of Object.entries( attributes ) ) {
		if ( key === 'style' ) {
			const syncedStyle = {};
			const unsyncedStyle = {};
			for ( const [ styleKey, styleValue ] of Object.entries(
				value ?? {}
			) ) {
				if ( ALL_SYNCED_STYLE_KEYS.has( styleKey ) ) {
					syncedStyle[ styleKey ] = styleValue;
				} else {
					unsyncedStyle[ styleKey ] = styleValue;
				}
			}
			if ( Object.keys( syncedStyle ).length ) {
				synced.style = syncedStyle;
			}
			if ( Object.keys( unsyncedStyle ).length ) {
				unsynced.style = unsyncedStyle;
			}
		} else if ( ALL_SYNCED_TOP_LEVEL_KEYS.has( key ) ) {
			synced[ key ] = value;
		} else {
			unsynced[ key ] = value;
		}
	}

	return { syncedAttributes: synced, unsyncedAttributes: unsynced };
}

/**
 * Merges the synced style sub-keys from an incoming partial style object into a
 * sibling's current style object, leaving unsynced sub-keys untouched.
 *
 * @param {Object} currentStyle    The sibling's current `style` attribute value.
 * @param {Object} incomingPartial The incoming partial `style` object (synced sub-keys only).
 * @return {Object} Merged style object.
 */
export function mergeStyleByGroups( currentStyle, incomingPartial ) {
	const merged = { ...currentStyle };
	for ( const [ styleKey, styleValue ] of Object.entries(
		incomingPartial
	) ) {
		if ( ALL_SYNCED_STYLE_KEYS.has( styleKey ) ) {
			merged[ styleKey ] = styleValue;
		}
	}
	return merged;
}

/**
 * Recursively collects all descendant blocks of a given type within a block
 * tree, depth-first. Used to find all synced-type blocks within a scope ancestor.
 *
 * @param {Object[]} blocks    Array of block objects (with nested innerBlocks).
 * @param {string}   blockName The block name to collect.
 * @return {Object[]} Matching block objects.
 */
export function findDescendantsOfType( blocks, blockName ) {
	const results = [];
	for ( const block of blocks ) {
		if ( block.name === blockName ) {
			results.push( block );
		}
		if ( block.innerBlocks?.length ) {
			results.push(
				...findDescendantsOfType( block.innerBlocks, blockName )
			);
		}
	}
	return results;
}
