import { useCallback } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { moveBlocksToNestedList } from './move-blocks-to-nested-list';
import { getIndentTarget } from './indent-outdent-targets';

export default function useIndentListItem( clientId ) {
	const registry = useRegistry();
	return useCallback( () => {
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

		const previousSiblingId = getIndentTarget( select, clientId );

		// Can't indent the first item: there is no sibling to nest it under.
		if ( ! previousSiblingId ) {
			return false;
		}

		const _hasMultiSelection = hasMultiSelection();
		const clientIds = _hasMultiSelection
			? getMultiSelectedBlockClientIds()
			: getSelectedBlockClientIds();
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
				multiSelect(
					clientIds[ 0 ],
					clientIds[ clientIds.length - 1 ]
				);
			}
		} );

		return true;
	}, [ clientId, registry ] );
}
