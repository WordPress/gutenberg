/**
 * @typedef {Object} MovedBlockDescriptor
 * @property {string}      clientId           Live clientId of the moved block.
 * @property {string}      name               Block name.
 * @property {number|null} authorId           Suggesting user id, or null.
 * @property {string|null} fromAnchorClientId Previous-sibling clientId at the
 *                                            old position, or null when the
 *                                            block was the first child.
 * @property {string}      fromParentClientId Old parent clientId ('' = root).
 * @property {number}      fromIndex          Old index within the old parent.
 */

/**
 * Build the anchor → ghost index from a flat list of moved-block
 * descriptors. Pure: all store access is injected via `resolvers` so this
 * is unit-testable without a registry.
 *
 * - `after`  : Map<anchorClientId, MovedBlockDescriptor[]> — render the ghost
 *              immediately after the (still-present) previous-sibling anchor.
 * - `before` : Map<firstSiblingClientId, MovedBlockDescriptor[]> — used when
 *              the block was the old parent's first child (null anchor) or the
 *              recorded anchor no longer exists; render the ghost before the
 *              old parent's current first (non-moved) child.
 *
 * A move whose old parent has no other children produces no ghost (graceful).
 *
 * @param {MovedBlockDescriptor[]}      moved                 Moved-block descriptors.
 * @param {Object}                      resolvers             Injected store accessors.
 * @param {(id:string)=>boolean}        resolvers.blockExists Does a clientId still
 *                                                            exist in the tree?
 * @param {(parentId:string)=>string[]} resolvers.getSiblings Current child order
 *                                                            of a parent.
 * @return {{ after: Map<string, MovedBlockDescriptor[]>,
 *            before: Map<string, MovedBlockDescriptor[]> }} The ghost index.
 */
export function buildMoveGhostIndex( moved, { blockExists, getSiblings } ) {
	const after = new Map();
	const before = new Map();
	const sorted = [ ...moved ].sort( ( a, b ) => a.fromIndex - b.fromIndex );

	const push = ( map, key, value ) => {
		if ( ! map.has( key ) ) {
			map.set( key, [] );
		}
		map.get( key ).push( value );
	};

	for ( const descriptor of sorted ) {
		const anchor = descriptor.fromAnchorClientId;
		if ( anchor && blockExists( anchor ) ) {
			push( after, anchor, descriptor );
			continue;
		}
		const siblings =
			getSiblings( descriptor.fromParentClientId ?? '' ) ?? [];
		const firstSibling = siblings.find(
			( id ) => id !== descriptor.clientId
		);
		if ( firstSibling ) {
			push( before, firstSibling, descriptor );
		}
	}

	return { after, before };
}
