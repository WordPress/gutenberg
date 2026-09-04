import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

export default function useIndentListItem( clientId ) {
	const registry = useRegistry();
	const {
		insertBlock,
		moveBlocksToPosition,
		removeBlock,
		updateBlockListSettings,
		selectionChange,
		multiSelect,
	} = useDispatch( blockEditorStore );
	const {
		getPreviousBlockClientId,
		getBlockRootClientId,
		getBlockListSettings,
		getSelectedBlockClientIds,
		getBlockOrder,
		getBlockAttributes,
		getSelectionStart,
		getSelectionEnd,
		hasMultiSelection,
		getMultiSelectedBlockClientIds,
	} = useSelect( blockEditorStore );

	return useCallback( () => {
		const _hasMultiSelection = hasMultiSelection();
		const clientIds = _hasMultiSelection
			? getMultiSelectedBlockClientIds()
			: getSelectedBlockClientIds();
		const previousSiblingId = getPreviousBlockClientId( clientId );
		const rootClientId = getBlockRootClientId( clientId );
		// The selection is read before the move because moving the blocks
		// updates it.
		const selectionStart = getSelectionStart();
		const selectionEnd = getSelectionEnd();

		registry.batch( () => {
			let nestedListId = getBlockOrder( previousSiblingId )[ 0 ];
			if ( ! nestedListId ) {
				// The list is inserted with a placeholder item already inside,
				// otherwise the empty list would scaffold its own item through
				// the block type's direct insert. The real items are then moved
				// in, keeping their client IDs, and the placeholder is removed.
				const placeholder = createBlock( 'core/list-item' );
				const indentedList = createBlock(
					'core/list',
					{ ordered: getBlockAttributes( rootClientId ).ordered },
					[ placeholder ]
				);
				nestedListId = indentedList.clientId;
				insertBlock( indentedList, 0, previousSiblingId, false );
				// Immediately update the block list settings, otherwise blocks
				// can't be moved here due to canInsert checks.
				updateBlockListSettings(
					nestedListId,
					getBlockListSettings( rootClientId )
				);
				moveBlocksToPosition( clientIds, rootClientId, nestedListId );
				removeBlock( placeholder.clientId, false );
			} else {
				moveBlocksToPosition( clientIds, rootClientId, nestedListId );
			}
		} );

		// The blocks keep their client IDs through the move, so the selection
		// is put back on the same blocks: the caret for a single item, a whole
		// block selection for several.
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

		return true;
	}, [ clientId ] );
}
