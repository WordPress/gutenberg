import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { cloneBlock } from '@wordpress/blocks';

export default function useIndentListItem( clientId ) {
	const registry = useRegistry();
	const {
		insertBlock,
		moveBlocksToPosition,
		removeBlocks,
		selectionChange,
		multiSelect,
	} = useDispatch( blockEditorStore );
	const {
		getPreviousBlockClientId,
		getBlockRootClientId,
		getSelectedBlockClientIds,
		getBlockOrder,
		getBlock,
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
			const nestedListId = getBlockOrder( previousSiblingId )[ 0 ];
			if ( nestedListId ) {
				moveBlocksToPosition( clientIds, rootClientId, nestedListId );
			} else {
				// Insert the list with the items already inside: an empty
				// list would be scaffolded with the list block type's
				// template, and moving into a freshly created list would
				// fail its canInsert check. Cloning the parent list keeps
				// its attributes; passing the items as inner blocks keeps
				// their client IDs.
				const indentedList = cloneBlock(
					getBlock( rootClientId ),
					{},
					clientIds.map( ( id ) => getBlock( id ) )
				);
				removeBlocks( clientIds, false );
				insertBlock( indentedList, 0, previousSiblingId, false );
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
