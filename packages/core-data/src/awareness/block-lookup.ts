/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Y } from '@wordpress/sync';
// @ts-ignore No exported types for block editor store selectors.
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import type { AbsoluteBlockIndexPath } from '../types';
import { unlock } from '../lock-unlock';

/**
 * A block as represented in the block-editor store's client ID tree.
 *
 * This is a minimal interface covering only the fields used by RTC awareness.
 */
export type EditorStoreBlock = {
	clientId: string;
	innerBlocks: EditorStoreBlock[];
};

/**
 * Find the block Y.Map that contains a nested Yjs type.
 *
 * Rich-text attributes are often stored directly at attributes.content, but
 * blocks can also store rich text deeper inside object or array attributes.
 * Walk upward until we find the block map instead of assuming a fixed parent
 * depth.
 *
 * @param yType - The nested Yjs type to start from.
 * @return The containing block Y.Map, or null if no block ancestor exists.
 */
export function getContainingBlockYMap(
	yType: Y.AbstractType< any >
): Y.Map< unknown > | null {
	let current: Y.AbstractType< any > | null = yType;

	while ( current ) {
		const parent = current.parent;

		if (
			parent instanceof Y.Map &&
			parent.parent instanceof Y.Array &&
			parent.get( 'clientId' ) !== undefined &&
			parent.get( 'innerBlocks' ) instanceof Y.Array
		) {
			return parent;
		}

		current = parent instanceof Y.AbstractType ? parent : null;
	}

	return null;
}

/**
 * Given a Y.Map within a Ydoc, traverse up the Yjs block tree to compute the
 * index path from the root.
 *
 * For example, the second inner block of the first root block returns [0, 1].
 *
 * @param yType - The Yjs block Y.Map to start from.
 * @return The index path from root, or null if traversal fails.
 */
export function getBlockPathInYdoc(
	yType: Y.Map< unknown >
): AbsoluteBlockIndexPath | null {
	const path: AbsoluteBlockIndexPath = [];
	let current: Y.Map< unknown > = yType;

	while ( current ) {
		const parentArray = current.parent;

		if ( ! parentArray || ! ( parentArray instanceof Y.Array ) ) {
			return null;
		}

		// Find index of current block in its parent array.
		let index = -1;
		for ( let i = 0; i < parentArray.length; i++ ) {
			if ( parentArray.get( i ) === current ) {
				index = i;
				break;
			}
		}

		if ( index === -1 ) {
			return null;
		}

		path.unshift( index );

		// Walk up: is the parent array's parent a block Y.Map or the root?
		const grandparent = parentArray.parent;
		if (
			grandparent instanceof Y.Map &&
			grandparent.get( 'clientId' ) !== undefined
		) {
			current = grandparent; // It's a block, keep going.
		} else {
			break; // It's the root map, done.
		}
	}

	return path;
}

/**
 * Navigate the block-editor store's block tree by an index path
 * and return the local block's clientId.
 *
 * @param path   - The index path, e.g. [0, 1] for blocks[0].innerBlocks[1].
 * @param blocks - The tree of block-editor store post contentblocks.
 * @return The local block clientId, or null if the path is invalid.
 */
export function resolveBlockClientIdByPath(
	path: AbsoluteBlockIndexPath,
	blocks: EditorStoreBlock[]
): string | null {
	if ( path.length === 0 ) {
		return null;
	}

	for ( let i = 0; i < path.length; i++ ) {
		const block = blocks[ path[ i ] ];
		if ( ! block ) {
			return null;
		}
		if ( i === path.length - 1 ) {
			return block.clientId;
		}
		blocks = block.innerBlocks;
	}
	return null;
}

/**
 * Find the post content blocks to use as the navigation root.
 *
 * In template mode, the block tree contains template parts wrapping a
 * core/post-content block. The Yjs document only stores the post content
 * blocks, so we need to find the core/post-content block and use
 * getClientIdsTree(clientId) to retrieve its inner blocks from the store.
 *
 * Uses the private getClientIdsTree selector which depends only on
 * state.blocks.order, avoiding unnecessary re-renders when block
 * attributes change (which would happen with getBlocks()).
 *
 * @return The blocks that correspond to the Yjs document root.
 */
export function usePostContentBlocks(): EditorStoreBlock[] {
	return useSelect( ( select ) => {
		const { getBlocksByName, getClientIdsTree } = unlock(
			select( blockEditorStore )
		);
		const [ postContentClientId ] = getBlocksByName( 'core/post-content' );
		return getClientIdsTree( postContentClientId ?? '' );
	}, [] );
}
