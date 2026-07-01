/**
 * Move-ghost index for Suggest mode, sourced from the live block tree.
 *
 * A structural "move" suggestion is stored on the moved block itself as
 * `metadata.suggestion.type === 'pending-move'` (with the block's old
 * position recorded alongside it), never in the in-memory overlay. This hook
 * scans the tree for those markers and builds the anchor → ghost index the
 * rendering HOC uses to draw a placeholder at each block's original position.
 *
 * It deliberately depends only on the block-editor store, not on the Suggest
 * overlay context: move suggestions live on the real block and must keep
 * rendering once the overlay is retired. See #73411.
 */
/**
 * WordPress dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { buildMoveGhostIndex } from './move-ghost-index';

// Referenced by name so the hook runs in tests and standalone contexts where
// the block-editor store isn't registered; it yields an empty index there.
const BLOCK_EDITOR_STORE_NAME = 'core/block-editor';

const EMPTY_GHOSTS = Object.freeze( {
	after: new Map(),
	before: new Map(),
	insideParent: new Map(),
} );

/**
 * Build the pending-move ghost index for the whole document.
 *
 * @return {{after:Map, before:Map, insideParent:Map}} Anchor → ghost index.
 * Empty when there are no pending moves (or no block-editor store).
 */
export default function useMoveGhosts() {
	const registry = useRegistry();

	// Single O(n) scan for pending-move markers, shared by every block via the
	// caller — avoids an O(n^2) per-block scan in the rendering HOC.
	//
	// `useSelect` must return a referentially stable value when state is
	// unchanged (otherwise `@wordpress/data` warns about wasted re-renders),
	// so it returns a primitive signature string that fully determines ghost
	// placement (clientId, old index/anchor/parent, whether the anchor still
	// exists, and the old parent's current first non-self sibling). The index
	// itself is rebuilt only when that signature changes.
	const moveSignature = useSelect( ( select ) => {
		const blockEditor = select( BLOCK_EDITOR_STORE_NAME );
		const ids = blockEditor?.getClientIdsWithDescendants?.() ?? [];
		// Collect the pending-move set first so anchor/sibling resolution in
		// the fingerprint matches `buildMoveGhostIndex`: a block that is itself
		// pending-moved can't anchor a ghost (it would drag the ghost to its
		// destination), so it must be treated as unusable here too — otherwise
		// the memo could miss a recompute when an anchor's moved-state is the
		// only thing that changed.
		const movedIds = new Set();
		for ( const clientId of ids ) {
			if (
				blockEditor.getBlockAttributes( clientId )?.metadata?.suggestion
					?.type === 'pending-move'
			) {
				movedIds.add( clientId );
			}
		}
		let signature = '';
		for ( const clientId of ids ) {
			const marker =
				blockEditor.getBlockAttributes( clientId )?.metadata
					?.suggestion;
			if ( marker?.type !== 'pending-move' ) {
				continue;
			}
			const fromParent = marker.fromParentClientId ?? '';
			const fromAnchor = marker.fromAnchorClientId ?? '';
			const anchorUsable =
				fromAnchor &&
				blockEditor.getBlockName( fromAnchor ) &&
				! movedIds.has( fromAnchor )
					? 1
					: 0;
			const firstSibling =
				blockEditor
					.getBlockOrder( fromParent )
					.find(
						( id ) => id !== clientId && ! movedIds.has( id )
					) ?? '';
			// Whether the old parent can host an inside-parent fallback ghost
			// (block existed, not root, not itself moved) — keeps the memo in
			// sync when only the parent's existence/moved-state changes.
			const parentUsable =
				fromParent &&
				blockEditor.getBlockName( fromParent ) &&
				! movedIds.has( fromParent )
					? 1
					: 0;
			signature += `${ clientId }:${
				marker.fromIndex ?? 0
			}:${ fromAnchor }:${ fromParent }:${ anchorUsable }:${ firstSibling }:${ parentUsable }|`;
		}
		return signature;
	}, [] );

	return useMemo( () => {
		if ( ! moveSignature ) {
			return EMPTY_GHOSTS;
		}
		const blockEditor = registry.select( BLOCK_EDITOR_STORE_NAME );
		if ( ! blockEditor?.getClientIdsWithDescendants ) {
			return EMPTY_GHOSTS;
		}
		const moved = [];
		for ( const clientId of blockEditor.getClientIdsWithDescendants() ) {
			const marker =
				blockEditor.getBlockAttributes( clientId )?.metadata
					?.suggestion;
			if ( marker?.type === 'pending-move' ) {
				moved.push( {
					clientId,
					name: blockEditor.getBlockName( clientId ),
					authorId: marker.authorId ?? null,
					fromAnchorClientId: marker.fromAnchorClientId ?? null,
					fromParentClientId: marker.fromParentClientId ?? '',
					fromIndex: marker.fromIndex ?? 0,
				} );
			}
		}
		if ( moved.length === 0 ) {
			return EMPTY_GHOSTS;
		}
		return buildMoveGhostIndex( moved, {
			blockExists: ( id ) => !! blockEditor.getBlockName( id ),
			getSiblings: ( parentId ) => blockEditor.getBlockOrder( parentId ),
		} );
	}, [ moveSignature, registry ] );
}
