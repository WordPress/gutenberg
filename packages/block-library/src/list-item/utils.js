import { store as blockEditorStore } from '@wordpress/block-editor';
import { cloneBlock } from '@wordpress/blocks';

/**
 * The previous sibling to nest a list item under when indenting, or undefined
 * for the first item, which has no sibling to nest under.
 *
 * @param {Object} select   The block editor store's selectors.
 * @param {string} clientId The list item's client ID.
 *
 * @return {string|undefined} The client ID to nest the item under.
 */
export function getIndentTarget( select, clientId ) {
	return select.getPreviousBlockClientId( clientId );
}

/**
 * The ancestor list item the given item's list is nested in when outdenting, or
 * undefined at the top level, where there is nothing to outdent to.
 *
 * @param {Object} select   The block editor store's selectors.
 * @param {string} clientId The list item's client ID.
 *
 * @return {string|undefined} The ancestor list item's client ID.
 */
export function getOutdentTarget( select, clientId ) {
	const listId = select.getBlockRootClientId( clientId );
	const parentListItemId = select.getBlockRootClientId( listId );
	if (
		! parentListItemId ||
		select.getBlockName( parentListItemId ) !== 'core/list-item'
	) {
		return undefined;
	}
	return parentListItemId;
}

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

/**
 * Indents the selected list items, nesting them under the previous sibling of
 * the given item. Defaults to the first selected item.
 *
 * @param {Object} registry   The data registry.
 * @param {string} [clientId] The list item providing the sibling to nest under.
 *
 * @return {boolean} Whether the items were indented.
 */
export function indentListItems( registry, clientId ) {
	const select = registry.select( blockEditorStore );
	const {
		getBlockRootClientId,
		getSelectedBlockClientIds,
		getSelectionStart,
		getSelectionEnd,
		hasMultiSelection,
		getMultiSelectedBlockClientIds,
	} = select;
	const { selectionChange, multiSelect } =
		registry.dispatch( blockEditorStore );

	const _hasMultiSelection = hasMultiSelection();
	const clientIds = _hasMultiSelection
		? getMultiSelectedBlockClientIds()
		: getSelectedBlockClientIds();

	if ( clientId === undefined ) {
		clientId = clientIds[ 0 ];
	}

	const previousSiblingId = getIndentTarget( select, clientId );

	// Can't indent the first item: there is no sibling to nest it under.
	if ( ! previousSiblingId ) {
		return false;
	}

	const rootClientId = getBlockRootClientId( clientId );
	// Read the selection before the move: creating a nested list removes and
	// re-inserts the items, which drops it.
	const selectionStart = getSelectionStart();
	const selectionEnd = getSelectionEnd();

	registry.batch( () => {
		moveBlocksToNestedList(
			registry,
			clientIds,
			rootClientId,
			previousSiblingId
		);

		// Put the selection back on the same blocks (client IDs are kept).
		if ( ! _hasMultiSelection ) {
			selectionChange(
				clientIds[ 0 ],
				selectionEnd.attributeKey,
				selectionEnd.clientId === selectionStart.clientId
					? selectionStart.offset
					: selectionEnd.offset,
				selectionEnd.offset
			);
		} else {
			multiSelect( clientIds[ 0 ], clientIds[ clientIds.length - 1 ] );
		}
	} );

	return true;
}

/**
 * Outdents list items, moving them up a level. Defaults to the selected items;
 * a specific set can be passed, e.g. to outdent an item's children.
 *
 * @param {Object}          registry    The data registry.
 * @param {string[]|string} [clientIds] The list items to outdent.
 *
 * @return {boolean} Whether the items were outdented.
 */
export function outdentListItems( registry, clientIds ) {
	const select = registry.select( blockEditorStore );
	const {
		getBlockRootClientId,
		getBlockName,
		getBlockOrder,
		getBlockIndex,
		getSelectedBlockClientIds,
	} = select;
	const { moveBlocksToPosition, removeBlock, multiSelect } =
		registry.dispatch( blockEditorStore );

	if ( clientIds === undefined ) {
		clientIds = getSelectedBlockClientIds();
	}

	if ( ! Array.isArray( clientIds ) ) {
		clientIds = [ clientIds ];
	}

	if ( ! clientIds.length ) {
		return false;
	}

	const firstClientId = clientIds[ 0 ];

	// Can't outdent if it's not a list item.
	if ( getBlockName( firstClientId ) !== 'core/list-item' ) {
		return false;
	}

	// Can't outdent if it's at the top level.
	const parentListItemId = getOutdentTarget( select, firstClientId );
	if ( ! parentListItemId ) {
		return false;
	}

	const parentListId = getBlockRootClientId( firstClientId );
	const lastClientId = clientIds[ clientIds.length - 1 ];
	const order = getBlockOrder( parentListId );
	const followingListItems = order.slice( getBlockIndex( lastClientId ) + 1 );

	registry.batch( () => {
		if ( followingListItems.length ) {
			// Nest the items that follow under the outdented item so they keep
			// their place below it.
			moveBlocksToNestedList(
				registry,
				followingListItems,
				parentListId,
				firstClientId
			);
		}
		moveBlocksToPosition(
			clientIds,
			parentListId,
			getBlockRootClientId( parentListItemId ),
			getBlockIndex( parentListItemId ) + 1
		);
		if ( ! getBlockOrder( parentListId ).length ) {
			const shouldSelectParent = false;
			removeBlock( parentListId, shouldSelectParent );
		}

		// Reset the lingering partial cross-block range to a whole block
		// selection. A single caret is preserved by the store on its own.
		if ( clientIds.length > 1 ) {
			multiSelect( firstClientId, lastClientId );
		}
	} );

	return true;
}
