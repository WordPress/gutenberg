/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { cloneBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { createListItem } from '../utils';

export default function useOutdentListItem( clientId ) {
	const { canOutdent } = useSelect(
		( innerSelect ) => {
			const { getBlockRootClientId } = innerSelect( blockEditorStore );
			const grandParentId = getBlockRootClientId(
				getBlockRootClientId( clientId )
			);
			return {
				canOutdent: !! grandParentId,
			};
		},
		[ clientId ]
	);
	const { replaceBlocks, selectionChange, multiSelect } =
		useDispatch( blockEditorStore );
	const {
		getBlockRootClientId,
		getBlockAttributes,
		getBlock,
		getBlockIndex,
		getSelectionStart,
		getSelectionEnd,
		hasMultiSelection,
		getMultiSelectedBlockClientIds,
	} = useSelect( blockEditorStore );

	return [
		canOutdent,
		useCallback( () => {
			const _hasMultiSelection = hasMultiSelection();
			const clientIds = _hasMultiSelection
				? getMultiSelectedBlockClientIds()
				: [ clientId ];

			const selectionStart = getSelectionStart();
			const selectionEnd = getSelectionEnd();

			const listParentId = getBlockRootClientId( clientId );
			const listAttributes = getBlockAttributes( listParentId );
			const listItemParentId = getBlockRootClientId( listParentId );
			const listItemParentAttributes =
				getBlockAttributes( listItemParentId );

			const firstIndex = getBlockIndex( first( clientIds ) );
			const lastIndex = getBlockIndex( last( clientIds ) );
			const siblingBlocks = getBlock( listParentId ).innerBlocks;
			const previousSiblings = siblingBlocks.slice( 0, firstIndex );
			const afterSiblings = siblingBlocks.slice( lastIndex + 1 );

			// Create a new parent list item block with just the siblings
			// that existed before the first child item being outdent.
			const newListItemParent = createListItem(
				listItemParentAttributes,
				listAttributes,
				previousSiblings
			);

			const lastBlock = getBlock( last( clientIds ) );
			const childList = lastBlock.innerBlocks[ 0 ];
			const childItems = childList?.innerBlocks || [];
			const hasChildItems = !! childItems.length;

			const newBlocksExcludingLast = clientIds
				.slice( 0, -1 )
				.map( ( _clientId ) => cloneBlock( getBlock( _clientId ) ) );

			// Create a new list item block whose attributes are equal to the
			// last block being outdent and whose children are the children that it had (if any)
			// followed by the siblings that existed after it.
			const newLastItem = createListItem(
				lastBlock.attributes,
				hasChildItems ? childList.attributes : listAttributes,
				[ ...childItems, ...afterSiblings ]
			);

			// Replace the parent list item block, with a new block containing
			// the previous siblings before the first block being outdent,
			// followed by the blocks being outdent with the after siblings added
			// as children of the last block.
			replaceBlocks(
				[ listItemParentId ],
				[ newListItemParent, ...newBlocksExcludingLast, newLastItem ]
			);

			// Restore the selection state.
			if ( ! _hasMultiSelection ) {
				selectionChange(
					newLastItem.clientId,
					selectionEnd.attributeKey,
					selectionEnd.clientId === selectionStart.clientId
						? selectionStart.offset
						: selectionEnd.offset,
					selectionEnd.offset
				);
			} else {
				multiSelect(
					first( newBlocksExcludingLast ).clientId,
					newLastItem.clientId
				);
			}
		}, [ clientId ] ),
	];
}
