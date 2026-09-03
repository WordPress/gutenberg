import { useCallback, useRef, useEffect } from '@wordpress/element';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { unlock } from '../../lock-unlock';
import { restoreSelection } from './restore-selection';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export default function useIndentListItem( clientId ) {
	const registry = useRegistry();
	const {
		insertBlock,
		moveBlocksToPosition,
		removeBlock,
		updateBlockListSettings,
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
	} = useSelect( blockEditorStore );

	// Indenting moves the items, which remounts them and drops the native
	// selection. Keep the document to rebuild the selection afterwards.
	const element = useBlockElement( clientId );
	const ownerDocumentRef = useRef();
	useEffect( () => {
		ownerDocumentRef.current = element?.ownerDocument;
	}, [ element ] );

	return useCallback( () => {
		const clientIds = getSelectedBlockClientIds();
		const previousSiblingId = getPreviousBlockClientId( clientId );
		const rootClientId = getBlockRootClientId( clientId );
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

		restoreSelection(
			ownerDocumentRef.current,
			selectionStart,
			selectionEnd
		);

		return true;
	}, [ clientId ] );
}
