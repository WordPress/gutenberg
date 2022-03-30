/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

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
	const { replaceBlocks, selectionChange } = useDispatch( blockEditorStore );
	const {
		getBlockRootClientId,
		getBlockAttributes,
		getBlock,
		getBlockIndex,
		getSelectionStart,
		getSelectionEnd,
	} = useSelect( blockEditorStore );

	return [
		canOutdent,
		useCallback( () => {
			const selectionStart = getSelectionStart();
			const selectionEnd = getSelectionEnd();

			const listParentId = getBlockRootClientId( clientId );
			const listAttributes = getBlockAttributes( listParentId );
			const listItemParentId = getBlockRootClientId( listParentId );
			const listItemParentAttributes = getBlockAttributes(
				listItemParentId
			);

			const index = getBlockIndex( clientId );
			const siblingBlocks = getBlock( listParentId ).innerBlocks;
			const previousSiblings = siblingBlocks.slice( 0, index );
			const afterSiblings = siblingBlocks.slice( index + 1 );

			// Create a new parent list item block with just the siblings
			// that existed before the child item being outdent.
			const newListItemParent = createListItem(
				listItemParentAttributes,
				listAttributes,
				previousSiblings
			);

			const block = getBlock( clientId );
			const childList = block.innerBlocks[ 0 ];
			const childItems = childList?.innerBlocks || [];
			const hasChildItems = !! childItems.length;

			// Create a new list item block whose attributes are equal to the
			// block being outdent and whose children are the children that it had (if any)
			// followed by the siblings that existed after it.
			const newItem = createListItem(
				block.attributes,
				hasChildItems ? childList.attributes : listAttributes,
				[ ...childItems, ...afterSiblings ]
			);

			// Replace the parent list item block, with a new block containing
			// the previous siblings, followed by another block containing after siblings
			// in relation to the block being outdent.
			replaceBlocks(
				[ listItemParentId ],
				[ newListItemParent, newItem ]
			);

			// Restore the selection state.
			selectionChange(
				newItem.clientId,
				selectionEnd.attributeKey,
				selectionEnd.clientId === selectionStart.clientId
					? selectionStart.offset
					: selectionEnd.offset,
				selectionEnd.offset
			);
		}, [ clientId ] ),
	];
}
