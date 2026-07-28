/**
 * WordPress dependencies
 */
import { useRegistry, useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { isUnmodifiedBlock, switchToBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useOutdentListItem from './use-outdent-list-item';

export default function useMerge( clientId, onMerge ) {
	const registry = useRegistry();
	const {
		getPreviousBlockClientId,
		getNextBlockClientId,
		getBlockOrder,
		getBlockRootClientId,
		getBlockName,
		getBlock,
	} = useSelect( blockEditorStore );
	const { mergeBlocks, moveBlocksToPosition, removeBlock, insertBlocks } =
		useDispatch( blockEditorStore );
	const outdentListItem = useOutdentListItem();

	function getTrailingId( id ) {
		const order = getBlockOrder( id );

		if ( ! order.length ) {
			return id;
		}

		return getTrailingId( order[ order.length - 1 ] );
	}

	function getParentListItemId( id ) {
		const listId = getBlockRootClientId( id );
		const parentListItemId = getBlockRootClientId( listId );
		if ( ! parentListItemId ) {
			return;
		}
		if ( getBlockName( parentListItemId ) !== 'core/list-item' ) {
			return;
		}
		return parentListItemId;
	}

	return ( forward ) => {
		function mergeWithNested( clientIdA, clientIdB ) {
			registry.batch( () => {
				// When merging a sub list item with a higher next list item, we
				// also need to move any nested list items. Check if there's a
				// listed list, and append its nested list items to the current
				// list.
				const [ nestedListClientId ] = getBlockOrder( clientIdB );
				if ( nestedListClientId ) {
					// If we are merging with the previous list item, and the
					// previous list item does not have nested list, move the
					// nested list to the previous list item.
					if (
						getPreviousBlockClientId( clientIdB ) === clientIdA &&
						! getBlockOrder( clientIdA ).length
					) {
						moveBlocksToPosition(
							[ nestedListClientId ],
							clientIdB,
							clientIdA
						);
					} else {
						moveBlocksToPosition(
							getBlockOrder( nestedListClientId ),
							nestedListClientId,
							getBlockRootClientId( clientIdA )
						);
					}
				}
				mergeBlocks( clientIdA, clientIdB );
			} );
		}

		if ( forward ) {
			// Start by diving into the nested list (if any); otherwise walk up
			// parent list items for a next sibling. `listItemId` ends on the
			// topmost list item if none is found.
			const innerListId = getBlockOrder( clientId )[ 0 ];
			let nextBlockClientId;
			let listItemId = clientId;
			if ( innerListId ) {
				nextBlockClientId = getBlockOrder( innerListId )[ 0 ];
			} else {
				while (
					! ( nextBlockClientId = getNextBlockClientId( listItemId ) )
				) {
					const parentLi = getParentListItemId( listItemId );
					if ( ! parentLi ) {
						break;
					}
					listItemId = parentLi;
				}
			}

			if ( ! nextBlockClientId ) {
				const outerListId = getBlockRootClientId( listItemId );
				const followingBlockId = getNextBlockClientId( outerListId );

				if ( followingBlockId ) {
					if ( getBlockName( followingBlockId ) === 'core/list' ) {
						registry.batch( () => {
							moveBlocksToPosition(
								getBlockOrder( followingBlockId ),
								followingBlockId,
								outerListId
							);
							removeBlock( followingBlockId, false );
						} );
					} else {
						const transformed = switchToBlockType(
							getBlock( followingBlockId ),
							'core/list'
						);
						const newInnerBlocks = transformed?.[ 0 ]?.innerBlocks;
						if ( newInnerBlocks?.length ) {
							registry.batch( () => {
								insertBlocks(
									newInnerBlocks,
									undefined,
									outerListId,
									false
								);
								removeBlock( followingBlockId, false );
							} );
						}
					}
				}
			} else if ( getParentListItemId( nextBlockClientId ) ) {
				outdentListItem( nextBlockClientId );
			} else {
				mergeWithNested( clientId, nextBlockClientId );
			}
		} else {
			// Merging is only done from the top level. For lowel levels, the
			// list item is outdented instead.
			if ( getParentListItemId( clientId ) ) {
				outdentListItem( clientId );
				return;
			}
			const previousBlockClientId = getPreviousBlockClientId( clientId );
			if ( previousBlockClientId ) {
				const trailingId = getTrailingId( previousBlockClientId );
				mergeWithNested( trailingId, clientId );
				return;
			}

			const blockOrder = getBlockOrder( clientId );
			if (
				isUnmodifiedBlock( getBlock( clientId ), 'content' ) &&
				blockOrder.length > 0
			) {
				registry.batch( () => {
					outdentListItem( getBlockOrder( blockOrder[ 0 ] ) );
					removeBlock( clientId, true );
				} );
			} else {
				onMerge( forward );
			}
		}
	};
}
