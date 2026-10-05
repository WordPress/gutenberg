/**
 * Derive the structural operation a `metadata.suggestion` marker stands
 * for, from the marker's own fields and the block's live position. This is
 * the fallback when no capture was recorded in this session (the marker
 * came in with the post, or a peer wrote it); the interceptor's recorded
 * capture is preferred because it saw the mutation happen.
 */
import type { SuggestionMarker } from '../marker';
import type { SuggestionOperation } from './payload';
import type { BlockTreeReader } from './plan';

/**
 * @param clientId The marked block.
 * @param marker   Its marker.
 * @param tree     Block tree selectors.
 * @return The structural operation, or null when the marker carries none
 * (a pending-attributes marker) or the block is gone.
 */
export function structuralOpFromMarker(
	clientId: string,
	marker: SuggestionMarker,
	tree: BlockTreeReader
): SuggestionOperation | null {
	const block = tree.getBlock?.( clientId );
	if ( ! block ) {
		return null;
	}
	const parentClientId = tree.getBlockRootClientId?.( clientId ) || null;
	const parentBlockName = parentClientId
		? ( tree.getBlockName?.( parentClientId ) ?? null )
		: null;
	const siblings = tree.getBlockOrder?.( parentClientId ?? '' ) ?? [];
	const index = siblings.indexOf( clientId );
	const anchorClientId = index > 0 ? siblings[ index - 1 ] : null;
	const groupId = marker.groupId ? { groupId: marker.groupId } : {};

	switch ( marker.type ) {
		case 'pending-remove':
			return {
				type: 'block-remove',
				clientId,
				blockName: block.name,
				parentBlockName,
				...groupId,
				block,
			};
		case 'pending-insert':
			return {
				type: 'block-insert-after',
				clientId,
				blockName: block.name,
				anchorClientId,
				parentClientId,
				parentBlockName,
				block,
				...groupId,
			};
		case 'pending-move':
			return {
				type: 'block-move',
				clientId,
				blockName: block.name,
				fromAnchorClientId: marker.fromAnchorClientId ?? null,
				fromParentClientId: marker.fromParentClientId ?? null,
				fromIndex: marker.fromIndex ?? 0,
				crossedParents: marker.crossedParents === true,
				toAnchorClientId: anchorClientId,
				toParentClientId: parentClientId,
				...( marker.fromParentBlock
					? { fromParentBlock: marker.fromParentBlock }
					: {} ),
			};
		default:
			return null;
	}
}
