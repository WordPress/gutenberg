import { useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { isUnmodifiedBlock, switchToBlockType } from '@wordpress/blocks';
import { outdentListItems, getOutdentTarget } from '../utils';

export default function useMerge( clientId, onMerge ) {
	const registry = useRegistry();

	return ( forward ) => {
		const select = registry.select( blockEditorStore );
		const {
			getPreviousBlockClientId,
			getNextBlockClientId,
			getBlockOrder,
			getBlockIndex,
			getBlockRootClientId,
			getBlockName,
			getBlock,
		} = select;
		const { mergeBlocks, moveBlocksToPosition, removeBlock, insertBlocks } =
			registry.dispatch( blockEditorStore );

		function getTrailingId( id ) {
			const order = getBlockOrder( id );

			if ( ! order.length ) {
				return id;
			}

			return getTrailingId( order[ order.length - 1 ] );
		}

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
					} else if (
						getOutdentTarget( select, clientIdB ) === clientIdA
					) {
						// Merging into the parent item's own line: the
						// children take the item's place in its list, one
						// level up, since their line moved there.
						moveBlocksToPosition(
							getBlockOrder( nestedListClientId ),
							nestedListClientId,
							getBlockRootClientId( clientIdB ),
							getBlockIndex( clientIdB ) + 1
						);
					} else {
						moveBlocksToPosition(
							getBlockOrder( nestedListClientId ),
							nestedListClientId,
							getBlockRootClientId( clientIdA )
						);
					}
				}
				const listId = getBlockRootClientId( clientIdB );
				mergeBlocks( clientIdA, clientIdB );
				// Merging the last item of a nested list into its parent
				// line leaves the list block empty.
				if ( ! getBlockOrder( listId ).length ) {
					removeBlock( listId, false );
				}
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
					const parentLi = getOutdentTarget( select, listItemId );
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
			} else {
				mergeWithNested( clientId, nextBlockClientId );
			}
		} else {
			// Merge into the previous line: the trailing item of the
			// previous sibling, or the parent item's own line for a first
			// child.
			const previousBlockClientId = getPreviousBlockClientId( clientId );
			if ( previousBlockClientId ) {
				const trailingId = getTrailingId( previousBlockClientId );
				mergeWithNested( trailingId, clientId );
				return;
			}
			const parentListItemId = getOutdentTarget( select, clientId );
			if ( parentListItemId ) {
				mergeWithNested( parentListItemId, clientId );
				return;
			}

			const blockOrder = getBlockOrder( clientId );
			if (
				isUnmodifiedBlock( getBlock( clientId ), 'content' ) &&
				blockOrder.length > 0
			) {
				registry.batch( () => {
					outdentListItems(
						registry,
						getBlockOrder( blockOrder[ 0 ] )
					);
					removeBlock( clientId, true );
				} );
			} else {
				onMerge( forward );
			}
		}
	};
}
