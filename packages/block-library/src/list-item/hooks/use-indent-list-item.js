/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, cloneBlock } from '@wordpress/blocks';

export default function useIndentListItem( clientId ) {
	const { replaceBlocks, selectionChange, multiSelect } =
		useDispatch( blockEditorStore );
	const {
		getBlock,
		getPreviousBlockClientId,
		getSelectionStart,
		getSelectionEnd,
		hasMultiSelection,
		getMultiSelectedBlockClientIds,
	} = useSelect( blockEditorStore );
	return useCallback( () => {
		const _hasMultiSelection = hasMultiSelection();
		const clientIds = _hasMultiSelection
			? getMultiSelectedBlockClientIds()
			: [ clientId ];
		const clonedBlocks = clientIds.map( ( _clientId ) =>
			cloneBlock( getBlock( _clientId ) )
		);
		const previousSiblingId = getPreviousBlockClientId( clientId );
		const newListItem = cloneBlock( getBlock( previousSiblingId ) );
		// If the sibling has no innerBlocks, create a new `list` block.
		if ( ! newListItem.innerBlocks?.length ) {
			newListItem.innerBlocks = [ createBlock( 'core/list' ) ];
		}
		// A list item usually has one `list`, but it's possible to have
		// more. So we need to preserve the previous `list` blocks and
		// merge the new blocks to the last `list`.
		newListItem.innerBlocks[
			newListItem.innerBlocks.length - 1
		].innerBlocks.push( ...clonedBlocks );

		// We get the selection start/end here, because when
		// we replace blocks, the selection is updated too.
		const selectionStart = getSelectionStart();
		const selectionEnd = getSelectionEnd();
		// Replace the previous sibling of the block being indented and the indented blocks,
		// with a new block whose attributes are equal to the ones of the previous sibling and
		// whose descendants are the children of the previous sibling, followed by the indented blocks.
		replaceBlocks( [ previousSiblingId, ...clientIds ], [ newListItem ] );
		if ( ! _hasMultiSelection ) {
			selectionChange(
				clonedBlocks[ 0 ].clientId,
				selectionEnd.attributeKey,
				selectionEnd.clientId === selectionStart.clientId
					? selectionStart.offset
					: selectionEnd.offset,
				selectionEnd.offset
			);
		} else {
			multiSelect(
				clonedBlocks[ 0 ].clientId,
				clonedBlocks[ clonedBlocks.length - 1 ].clientId
			);
		}

		return true;
	}, [ clientId ] );
}
