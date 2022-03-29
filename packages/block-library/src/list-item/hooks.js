/**
 * External dependencies
 */
import { first } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createBlock,
	getDefaultBlockName,
	cloneBlock,
} from '@wordpress/blocks';
import { useRef, useCallback } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { ENTER } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { createListItem } from './utils';

export function useIndentListItem( clientId ) {
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

export function useOutdentListItem( clientId ) {
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

export function useEnter( props ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const {
		getBlock,
		getBlockRootClientId,
		getBlockParents,
		getBlockIndex,
	} = useSelect( blockEditorStore );
	const propsRef = useRef( props );
	propsRef.current = props;
	const [ canOutdent, outdentListItem ] = useOutdentListItem(
		propsRef.current.clientId
	);
	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				if ( event.defaultPrevented || event.keyCode !== ENTER ) {
					return;
				}
				const { content, clientId } = propsRef.current;
				if ( content.length ) {
					return;
				}
				event.preventDefault();
				if ( canOutdent ) {
					outdentListItem();
					return;
				}
				// Here we are in top level list so we need to split.
				const blockRootClientId = getBlockRootClientId( clientId );
				const blockParents = getBlockParents( clientId );
				const topParentListBlockClientId = blockParents[ 0 ];
				const topParentListBlock = getBlock(
					topParentListBlockClientId
				);
				const blockIndex = getBlockIndex( clientId );
				const head = cloneBlock( {
					...topParentListBlock,
					innerBlocks: topParentListBlock.innerBlocks.slice(
						0,
						blockIndex
					),
				} );
				const middle = createBlock( getDefaultBlockName() );
				// Last list item might contain a `list` block innerBlock
				// In that case append remaining innerBlocks blocks.
				const after = [
					...( topParentListBlock.innerBlocks[ blockIndex ]
						.innerBlocks[ 0 ]?.innerBlocks || [] ),
					...topParentListBlock.innerBlocks.slice( blockIndex + 1 ),
				];
				const tail = after.length
					? [
							cloneBlock( {
								...topParentListBlock,
								innerBlocks: after,
							} ),
					  ]
					: [];
				replaceBlocks(
					blockRootClientId,
					[ head, middle, ...tail ],
					1,
					0
				);
			}

			element.addEventListener( 'keydown', onKeyDown );
			return () => {
				element.removeEventListener( 'keydown', onKeyDown );
			};
		},
		[ canOutdent ]
	);
}
