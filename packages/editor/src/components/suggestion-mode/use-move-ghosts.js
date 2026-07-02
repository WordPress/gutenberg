/**
 * Move-ghost index for Suggest mode, sourced from the live block tree.
 *
 * A structural "move" suggestion is stored on the moved block itself as
 * `metadata.suggestion.type === 'pending-move'` (with the block's old
 * position recorded alongside it), never in the in-memory overlay. The
 * provider below scans the tree for those markers ONCE per store change and
 * publishes the anchor → ghost index over context; the per-block rendering
 * HOC reads its own clientId's slice from that shared index. Without the
 * hoist every block ran the scan inside its own `useSelect` — N blocks ×
 * O(N) per store change, quadratic in document size during suggest sessions.
 *
 * It deliberately depends only on the block-editor store, not on the Suggest
 * overlay context: move suggestions live on the real block and must keep
 * rendering once the overlay is retired. See #73411.
 */
/**
 * WordPress dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';
import { createContext, useContext, useMemo } from '@wordpress/element';

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

/*
 * Default is the empty index, so the per-block hook is inert wherever the
 * provider isn't mounted (experiment off, isolated unit tests).
 */
const MoveGhostContext = createContext( EMPTY_GHOSTS );

/**
 * Build the pending-move ghost index for the whole document. Internal to the
 * provider — per-block consumers must go through `useMoveGhosts` so the
 * document scan runs once, not once per block.
 *
 * @return {{after:Map, before:Map, insideParent:Map}} Anchor → ghost index.
 * Empty when there are no pending moves (or no block-editor store).
 */
function useMoveGhostIndex() {
	const registry = useRegistry();

	// Single O(n) scan for pending-move markers, run once at the provider
	// level and shared with every block through context — never per block.
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

/**
 * Provider computing the document-wide move-ghost index once and sharing it
 * with every block. Mounted by the editor provider inside the Suggestion Mode
 * experiment gate; move ghosts render in every intent (a reviewer in Edit
 * intent needs to see a pending move), so the provider is not intent-gated.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function MoveGhostsProvider( { children } ) {
	const ghosts = useMoveGhostIndex();
	return (
		<MoveGhostContext.Provider value={ ghosts }>
			{ children }
		</MoveGhostContext.Provider>
	);
}

/**
 * Read the shared move-ghost index. Cheap per block: a context read, no
 * store subscription and no tree scan.
 *
 * @return {{after:Map, before:Map, insideParent:Map}} Anchor → ghost index.
 */
export default function useMoveGhosts() {
	return useContext( MoveGhostContext );
}
