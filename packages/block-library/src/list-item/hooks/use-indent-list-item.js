import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { moveBlocksToNestedList } from './move-blocks-to-nested-list';

export default function useIndentListItem( clientId ) {
	const registry = useRegistry();
	const { selectionChange, multiSelect } = useDispatch( blockEditorStore );
	const {
		getPreviousBlockClientId,
		getBlockRootClientId,
		getSelectedBlockClientIds,
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

		// The move and the selection are batched together: creating a nested
		// list removes and re-inserts the items, which drops the selection, so
		// it is put back in the same pass. The blocks keep their client IDs, so
		// it lands on the same blocks: the caret for a single item, a whole
		// block selection for several.
		registry.batch( () => {
			moveBlocksToNestedList(
				registry,
				clientIds,
				rootClientId,
				previousSiblingId
			);

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
				multiSelect(
					clientIds[ 0 ],
					clientIds[ clientIds.length - 1 ]
				);
			}
		} );

		return true;
	}, [ clientId ] );
}
