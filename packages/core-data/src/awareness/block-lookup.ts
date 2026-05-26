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

/**
 * A block as represented in the block-editor store (from `getBlocks()`).
 *
 * This is a minimal interface covering only the fields used by RTC awareness.
 */
export type EditorStoreBlock = {
	clientId: string;
	name: string;
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
 * getBlocks(clientId) to retrieve its inner blocks from the store.
 *
 * We must use getBlocks(clientId) rather than reading .innerBlocks from
 * the block object because useBlockSync() injects post content as
 * controlled inner blocks — they exist in the store's block order map
 * but are not populated in the .innerBlocks property of the tree
 * returned by getBlocks().
 *
 * @return The blocks that correspond to the Yjs document root.
 */
export function usePostContentBlocks(): EditorStoreBlock[] {
	return useSelect( ( select ) => {
		const { getBlocks } = select( blockEditorStore );
		const rootBlocks = getBlocks();
		const postContentBlock = findBlockByName(
			rootBlocks,
			'core/post-content'
		);
		if ( postContentBlock ) {
			// Use getBlocks(clientId) to read controlled inner blocks from
			// the store, since postContentBlock.innerBlocks is empty.
			return getBlocks( postContentBlock.clientId );
		}

		return rootBlocks;
	}, [] );
}

/**
 * Recursively search the block tree for a block with a given name.
 *
 * @param blocks - The blocks to search.
 * @param name   - The block name to find.
 * @return The first matching block, or null if not found.
 */
function findBlockByName(
	blocks: EditorStoreBlock[],
	name: string
): EditorStoreBlock | null {
	for ( const block of blocks ) {
		if ( block.name === name ) {
			return block;
		}
		if ( block.innerBlocks?.length ) {
			const found = findBlockByName( block.innerBlocks, name );
			if ( found ) {
				return found;
			}
		}
	}
	return null;
}
