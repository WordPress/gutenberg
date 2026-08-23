export interface MovedBlockDescriptor {
	/** Live clientId of the moved block. */
	clientId: string;
	/** Block name. */
	name: string;
	/** Suggesting user id, or null. */
	authorId: number | null;
	/**
	 * Previous-sibling clientId at the old position, or null when the block
	 * was the first child.
	 */
	fromAnchorClientId: string | null;
	/** Old parent clientId ('' = root). */
	fromParentClientId: string;
	/** Old index within the old parent. */
	fromIndex: number;
}

export type MoveGhostIndex = Map< string, MovedBlockDescriptor[] >;

/**
 * Build the anchor → ghost index from a flat list of moved-block
 * descriptors. Pure: all store access is injected via `resolvers` so this
 * is unit-testable without a registry.
 *
 * - `after`        : Map<anchorClientId, MovedBlockDescriptor[]> — render the
 *                    ghost immediately after the (still-present) previous-
 *                    sibling anchor.
 * - `before`       : Map<firstSiblingClientId, MovedBlockDescriptor[]> — used
 *                    when the block was the old parent's first child (null
 *                    anchor) or the recorded anchor no longer exists; render
 *                    the ghost before the old parent's current first
 *                    (non-moved) child.
 * - `insideParent` : Map<oldParentClientId, MovedBlockDescriptor[]> — used
 *                    when no sibling survives in the old parent (the moved
 *                    block was an only child, or every sibling also moved
 *                    away). The ghost renders adjacent to the now-empty old
 *                    parent so the original position still has a cue.
 *
 * A move at the root with no surviving sibling, or whose old parent is itself
 * gone or pending-moved, produces no ghost (graceful) — there is no stable
 * place to anchor it.
 *
 * @param moved                 Moved-block descriptors.
 * @param resolvers             Injected store accessors.
 * @param resolvers.blockExists Does a clientId still exist in the tree?
 * @param resolvers.getSiblings Current child order of a parent.
 * @return The ghost index.
 */
export function buildMoveGhostIndex(
	moved: MovedBlockDescriptor[],
	{
		blockExists,
		getSiblings,
	}: {
		blockExists: ( id: string ) => boolean;
		getSiblings: ( parentId: string ) => string[];
	}
) {
	const after: MoveGhostIndex = new Map();
	const before: MoveGhostIndex = new Map();
	const insideParent: MoveGhostIndex = new Map();
	const sorted = [ ...moved ].sort( ( a, b ) => a.fromIndex - b.fromIndex );

	// A pending-moved block is itself displaced to its new position, so it
	// cannot serve as a stable original-position anchor: a ghost attached to
	// it would follow it to the destination instead of marking the spot the
	// moved block left. Exclude every moved block from anchor selection, both
	// the recorded previous-sibling anchor and the first-child fallback.
	const movedIds = new Set(
		moved.map( ( descriptor ) => descriptor.clientId )
	);
	const isUsableAnchor = ( id: string | null | undefined ) =>
		!! id && blockExists( id ) && ! movedIds.has( id );

	const push = (
		map: MoveGhostIndex,
		key: string,
		value: MovedBlockDescriptor
	) => {
		if ( ! map.has( key ) ) {
			map.set( key, [] );
		}
		map.get( key )!.push( value );
	};

	for ( const descriptor of sorted ) {
		const anchor = descriptor.fromAnchorClientId;
		if ( isUsableAnchor( anchor ) ) {
			push( after, anchor!, descriptor );
			continue;
		}
		const parentId = descriptor.fromParentClientId ?? '';
		const siblings = getSiblings( parentId ) ?? [];
		const firstSibling = siblings.find(
			( id: string ) => id !== descriptor.clientId && ! movedIds.has( id )
		);
		if ( firstSibling ) {
			push( before, firstSibling, descriptor );
			continue;
		}
		// No surviving sibling to anchor on (only child, or all siblings also
		// moved). Fall back to the old parent so the ghost still appears at
		// the emptied container instead of vanishing. Skipped at the root
		// ('' has no parent block to anchor on) and when the old parent is
		// itself gone or pending-moved — anchoring there would drag the ghost
		// to the parent's destination, the same displacement `isUsableAnchor`
		// guards against.
		if ( isUsableAnchor( parentId ) ) {
			push( insideParent, parentId, descriptor );
		}
	}

	return { after, before, insideParent };
}
