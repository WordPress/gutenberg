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
import type { ReactNode } from 'react';
import { useRegistry, useSelect } from '@wordpress/data';
import { createContext, useContext, useMemo } from '@wordpress/element';
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
 * The parent a pending move's ghost goes in. The recorded parent is a
 * session-local client id that parsing regenerates, so after a reload it
 * matches no block. Fall back to the moved block's current parent, where
 * Reject restores the block too, rather than letting the ghost vanish.
 *
 * @param blockEditor Block-editor selectors.
 * @param clientId    The moved block.
 * @param fromParent  The recorded parent ('' = root).
 * @return The parent to place the ghost in.
 */
function resolveGhostParent(
	blockEditor: any,
	clientId: string,
	fromParent: string
): string {
	if ( fromParent === '' || blockEditor.getBlockName( fromParent ) ) {
		return fromParent;
	}
	return blockEditor.getBlockRootClientId( clientId ) ?? '';
}

/**
 * The pending-move ghost index for the current block tree.
 *
 * @param blockEditor Block-editor selectors, or undefined without the store.
 * @return Anchor → ghost index, or null when there are no pending moves.
 */
function computeMoveGhostIndex( blockEditor: any ) {
	if ( ! blockEditor?.getClientIdsWithDescendants ) {
		return null;
	}
	const moved = [];
	for ( const clientId of blockEditor.getClientIdsWithDescendants() ) {
		const marker =
			blockEditor.getBlockAttributes( clientId )?.metadata?.suggestion;
		if ( marker?.type === 'pending-move' ) {
			moved.push( {
				clientId,
				name: blockEditor.getBlockName( clientId ),
				authorId: marker.authorId ?? null,
				fromAnchorClientId: marker.fromAnchorClientId ?? null,
				fromParentClientId: resolveGhostParent(
					blockEditor,
					clientId,
					marker.fromParentClientId ?? ''
				),
				fromIndex: marker.fromIndex ?? 0,
			} );
		}
	}
	if ( moved.length === 0 ) {
		return null;
	}
	return buildMoveGhostIndex( moved, {
		blockExists: ( id: string ) => !! blockEditor.getBlockName( id ),
		getSiblings: ( parentId: string ) =>
			blockEditor.getBlockOrder( parentId ),
	} );
}

/**
 * Build the pending-move ghost index for the whole document. Internal to the
 * provider — per-block consumers must go through `useMoveGhosts` so the
 * document scan runs once, not once per block.
 *
 * @return Anchor → ghost index. Empty when there are no pending moves (or no
 * block-editor store).
 */
function useMoveGhostIndex() {
	const registry = useRegistry();

	// Single O(n) scan for pending-move markers, run once at the provider
	// level and shared with every block through context — never per block.
	//
	// `useSelect` must return a referentially stable value when state is
	// unchanged (otherwise `@wordpress/data` warns about wasted re-renders),
	// so it returns a primitive signature of the built index: every ghost's
	// placement and what it renders. The index itself is rebuilt only when
	// that signature changes.
	const moveSignature = useSelect( ( select ) => {
		const index = computeMoveGhostIndex(
			select( BLOCK_EDITOR_STORE_NAME )
		);
		if ( ! index ) {
			return '';
		}
		let signature = '';
		for ( const [ placement, map ] of Object.entries( index ) ) {
			for ( const [ key, ghosts ] of map ) {
				for ( const ghost of ghosts ) {
					signature += `${ placement }:${ key }:${ ghost.clientId }:${ ghost.name }:${ ghost.authorId }|`;
				}
			}
		}
		return signature;
	}, [] );

	return useMemo(
		() =>
			( moveSignature &&
				computeMoveGhostIndex(
					registry.select( BLOCK_EDITOR_STORE_NAME )
				) ) ||
			EMPTY_GHOSTS,
		[ moveSignature, registry ]
	);
}

/**
 * Provider computing the document-wide move-ghost index once and sharing it
 * with every block. Mounted by the editor provider inside the Suggestion Mode
 * experiment gate; move ghosts render in every intent (a reviewer in Edit
 * intent needs to see a pending move), so the provider is not intent-gated.
 *
 * @param props          Props.
 * @param props.children Child elements.
 */
export function MoveGhostsProvider( { children }: { children: ReactNode } ) {
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
 * @return Anchor → ghost index.
 */
export default function useMoveGhosts() {
	return useContext( MoveGhostContext );
}
