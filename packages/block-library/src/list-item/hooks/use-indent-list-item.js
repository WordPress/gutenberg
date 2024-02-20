/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

export default function useIndentListItem( clientId ) {
	const registry = useRegistry();
	const { insertBlock, moveBlocksToPosition, updateBlockListSettings } =
		useDispatch( blockEditorStore );
	const {
		getPreviousBlockClientId,
		getBlockRootClientId,
		getBlockListSettings,
		getSelectedBlockClientIds,
	} = useSelect( blockEditorStore );
	return useCallback( () => {
		const clientIds = getSelectedBlockClientIds();
		const previousSiblingId = getPreviousBlockClientId( clientId );
		const rootClientId = getBlockRootClientId( clientId );

		registry.batch( () => {
			const indentedList = createBlock( 'core/list' );
			insertBlock( indentedList, 0, previousSiblingId, false );
			// Immediately update the block list settings, otherwise blocks
			// can't be moved here due to canInsert checks.
			updateBlockListSettings(
				indentedList.clientId,
				getBlockListSettings( rootClientId )
			);
			moveBlocksToPosition(
				clientIds,
				rootClientId,
				indentedList.clientId
			);
		} );

		return true;
	}, [ clientId ] );
}
