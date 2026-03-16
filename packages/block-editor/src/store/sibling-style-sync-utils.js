/**
 * Maps style group names (as declared in __experimentalSiblingStyleSync) to the
 * block attributes they cover.
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

/**
 * Splits an attributes object into two buckets: attributes that belong to the
 * declared sync groups, and attributes that do not.
 *
 * Handles both top-level attributes (e.g. `textColor`) and sub-keys of the
 * nested `style` attribute object (e.g. `style.color`).
 *
 * @param {Object}   attributes Changed block attributes.
 * @param {string[]} groups     Declared sync groups (e.g. ['color', 'typography']).
 * @return {{ syncedAttributes: Object, unsyncedAttributes: Object }} Object with attributes split into synced and unsynced buckets.
 */
export function partitionAttributesByGroups( attributes, groups ) {
	const resolvedGroups =
		groups === 'all' ? Object.keys( STYLE_GROUP_MAP ) : groups;
	const syncedTopLevelKeys = new Set(
		resolvedGroups.flatMap( ( g ) => STYLE_GROUP_MAP[ g ]?.topLevel ?? [] )
	);
	const syncedStyleKeys = new Set(
		resolvedGroups
			.map( ( g ) => STYLE_GROUP_MAP[ g ]?.styleKey )
			.filter( Boolean )
	);

	const synced = {};
	const unsynced = {};

	for ( const [ key, value ] of Object.entries( attributes ) ) {
		if ( key === 'style' ) {
			const syncedStyle = {};
			const unsyncedStyle = {};
			for ( const [ styleKey, styleValue ] of Object.entries(
				value ?? {}
			) ) {
				if ( syncedStyleKeys.has( styleKey ) ) {
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
		} else if ( syncedTopLevelKeys.has( key ) ) {
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
 * For example, if `groups` includes 'color' but not 'spacing', a sibling's
 * custom spacing will be preserved even as its color is overwritten.
 *
 * @param {Object}   currentStyle    The sibling's current `style` attribute value.
 * @param {Object}   incomingPartial The incoming partial `style` object (synced sub-keys only).
 * @param {string[]} groups          Declared sync groups.
 * @return {Object} Merged style object.
 */
export function mergeStyleByGroups( currentStyle, incomingPartial, groups ) {
	const resolvedGroups =
		groups === 'all' ? Object.keys( STYLE_GROUP_MAP ) : groups;
	const syncedStyleKeys = new Set(
		resolvedGroups
			.map( ( g ) => STYLE_GROUP_MAP[ g ]?.styleKey )
			.filter( Boolean )
	);
	const merged = { ...currentStyle };
	for ( const [ styleKey, styleValue ] of Object.entries(
		incomingPartial
	) ) {
		if ( syncedStyleKeys.has( styleKey ) ) {
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
