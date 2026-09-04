import { store as blockEditorStore } from '@wordpress/block-editor';
import { cloneBlock } from '@wordpress/blocks';

/**
 * Moves blocks into a list item's nested list, keeping their client IDs. If the
 * list item has no nested list yet, one is created from the source list so it
 * inherits its attributes.
 *
 * @param {Object}   registry     The data registry.
 * @param {string[]} clientIds    The blocks to move.
 * @param {string}   sourceListId The list the blocks currently live in, also
 *                                cloned when a nested list has to be created.
 * @param {string}   listItemId   The list item to nest the blocks under.
 */
export function moveBlocksToNestedList(
	registry,
	clientIds,
	sourceListId,
	listItemId
) {
	const { getBlockOrder, getBlock } = registry.select( blockEditorStore );
	const { moveBlocksToPosition, removeBlocks, insertBlock } =
		registry.dispatch( blockEditorStore );
	// A list item can hold more than one nested list; append to the last one,
	// the same subtree a reader sees at the end of the item.
	const nestedLists = getBlockOrder( listItemId );
	const nestedListId = nestedLists[ nestedLists.length - 1 ];

	if ( nestedListId ) {
		moveBlocksToPosition( clientIds, sourceListId, nestedListId );
		return;
	}

	// Insert the list with the items already inside: an empty list would be
	// scaffolded with the list block type's template, and moving into a freshly
	// created list would fail its canInsert check. Cloning the source list keeps
	// its attributes; passing the items as inner blocks keeps their client IDs.
	const nestedList = cloneBlock(
		getBlock( sourceListId ),
		{},
		clientIds.map( ( id ) => getBlock( id ) )
	);
	// Remove and re-insert in one batch so the blocks are never momentarily
	// detached. A caller batch nests harmlessly: only the outermost flushes.
	registry.batch( () => {
		removeBlocks( clientIds, false );
		insertBlock( nestedList, 0, listItemId, false );
	} );
}
