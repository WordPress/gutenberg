/**
 * WordPress dependencies
 */
import { cloneBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * A function that returns an event handler function for block drop events.
 *
 * @param {Function} getBlockIndex             A function that gets the index of a block.
 * @param {Function} getClientIdsOfDescendants A function that gets the client ids of descendant blocks.
 * @param {Function} moveBlocksToPosition      A function that moves blocks.
 * @param {Function} insertBlocks              A function that inserts blocks.
 * @param {Function} clearSelectedBlock        A function that clears block selection.
 * @return {Function} The event handler for a block drop event.
 */
export function onBlockDrop(
	getBlockIndex,
	getClientIdsOfDescendants,
	moveBlocksToPosition,
	insertBlocks,
	clearSelectedBlock
) {
	return ( {
		blocks,
		srcClientIds: sourceClientIds,
		srcRootClientId: sourceRootClientId,
		targetBlockIndex,
		targetRootClientId,
		type: dropType,
	} ) => {
		// If the user is inserting a block.
		if ( dropType === 'inserter' ) {
			clearSelectedBlock();
			const blocksToInsert = blocks.map( ( block ) =>
				cloneBlock( block )
			);
			insertBlocks(
				blocksToInsert,
				targetBlockIndex,
				targetRootClientId,
				true,
				null
			);
		}

		// If the user is moving a block.
		if ( dropType === 'block' ) {
			const sourceBlockIndex = getBlockIndex( sourceClientIds[ 0 ] );

			// If the user is dropping to the same position, return early.
			if (
				sourceRootClientId === targetRootClientId &&
				sourceBlockIndex === targetBlockIndex
			) {
				return;
			}

			// If the user is attempting to drop a block within its own
			// nested blocks, return early as this would create infinite
			// recursion.
			if (
				sourceClientIds.includes( targetRootClientId ) ||
				getClientIdsOfDescendants( sourceClientIds ).some(
					( id ) => id === targetRootClientId
				)
			) {
				return;
			}

			const isAtSameLevel = sourceRootClientId === targetRootClientId;
			const draggedBlockCount = sourceClientIds.length;

			// If the block is kept at the same level and moved downwards,
			// subtract to take into account that the blocks being dragged
			// were removed from the block list above the insertion point.
			const insertIndex =
				isAtSameLevel && sourceBlockIndex < targetBlockIndex
					? targetBlockIndex - draggedBlockCount
					: targetBlockIndex;

			moveBlocksToPosition(
				sourceClientIds,
				sourceRootClientId,
				targetRootClientId,
				insertIndex
			);
		}
	};
}

/**
 * A React hook for handling block drop events.
 *
 * @return {Function} The event handler for a block drop event.
 */
export default function useOnBlockDrop() {
	const { getBlockIndex, getClientIdsOfDescendants } =
		useSelect( blockEditorStore );
	const { insertBlocks, moveBlocksToPosition, clearSelectedBlock } =
		useDispatch( blockEditorStore );

	return onBlockDrop(
		getBlockIndex,
		getClientIdsOfDescendants,
		moveBlocksToPosition,
		insertBlocks,
		clearSelectedBlock
	);
}
