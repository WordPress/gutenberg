/**
 * External dependencies
 */
import { first } from 'lodash';

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

export default function useIndentListItem( clientId ) {
	const { canIndent } = useSelect(
		( innerSelect ) => {
			const { getBlockIndex } = innerSelect( blockEditorStore );
			return {
				canIndent: getBlockIndex( clientId ) > 0,
			};
		},
		[ clientId ]
	);
	const { replaceBlocks, selectionChange } = useDispatch( blockEditorStore );
	const {
		getBlockRootClientId,
		getBlock,
		getBlockOrder,
		getSelectionStart,
		getSelectionEnd,
		getBlockIndex,
	} = useSelect( blockEditorStore );

	return [
		canIndent,
		useCallback( () => {
			const selectionStart = getSelectionStart();
			const selectionEnd = getSelectionEnd();

			const parentId = getBlockRootClientId( clientId );
			const previousSiblingId = getBlockOrder( parentId )[
				getBlockIndex( clientId ) - 1
			];
			const previousSibling = getBlock( previousSiblingId );
			const previousSiblingChildren =
				first( previousSibling.innerBlocks )?.innerBlocks || [];
			const previousSiblingListAttributes =
				first( previousSibling.innerBlocks )?.attributes || {};
			const block = getBlock( clientId );

			const childListAttributes = first( block.innerBlocks )?.attributes;
			const childItemBlocks =
				first( block.innerBlocks )?.innerBlocks || [];

			const newBlock = createListItem(
				block.attributes,
				childListAttributes,
				childItemBlocks
			);
			// Replace the previous sibling of the block being indented and the indented block,
			// with a new block whose attributes are equal to the ones of the previous sibling and
			// whose descendants are the children of the previous sibling, followed by the indented block.
			replaceBlocks(
				[ previousSiblingId, clientId ],
				[
					createListItem(
						previousSibling.attributes,
						previousSiblingListAttributes,
						[ ...previousSiblingChildren, newBlock ]
					),
				]
			);

			// Restore the selection state.
			selectionChange(
				newBlock.clientId,
				selectionEnd.attributeKey,
				selectionEnd.clientId === selectionStart.clientId
					? selectionStart.offset
					: selectionEnd.offset,
				selectionEnd.offset
			);
		}, [ clientId ] ),
	];
}
