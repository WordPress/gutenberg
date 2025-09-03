/**
 * WordPress dependencies
 */
import { useRegistry, useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

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
	const { mergeBlocks, moveBlocksToPosition, removeBlock } =
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

	/**
	 * Return the next list item with respect to the given list item. If none,
	 * return the next list item of the parent list item if it exists.
	 *
	 * @param {string} id A list item client ID.
	 * @return {?string} The client ID of the next list item.
	 */
	function _getNextId( id ) {
		const next = getNextBlockClientId( id );
		if ( next ) {
			return next;
		}
		const parentListItemId = getParentListItemId( id );
		if ( ! parentListItemId ) {
			return;
		}
		return _getNextId( parentListItemId );
	}

	/**
	 * Given a client ID, return the client ID of the list item on the next
	 * line, regardless of indentation level.
	 *
	 * @param {string} id The client ID of the current list item.
	 * @return {?string} The client ID of the next list item.
	 */
	function getNextId( id ) {
		const order = getBlockOrder( id );

		// If the list item does not have a nested list, return the next list
		// item.
		if ( ! order.length ) {
			return _getNextId( id );
		}

		// Get the first list item in the nested list.
		return getBlockOrder( order[ 0 ] )[ 0 ];
	}

	/**
	 * Handle deletion of an empty list item that has nested children.
	 * Promotes the nested children to the parent level.
	 *
	 * @param {string} id The client ID of the empty list item.
	 * @return {boolean} True if handled, false otherwise.
	 */
	function handleEmptyListItemWithChildren( id ) {
		const block = getBlock( id );
		const content = block?.attributes?.content || '';
		const isEmpty = ! content || content.trim() === '';
		const hasNestedItems =
			block?.innerBlocks && block.innerBlocks.length > 0;

		if ( ! isEmpty || ! hasNestedItems ) {
			return false;
		}

		registry.batch( () => {
			// Get the list container that holds this list-item.
			const listContainerId = getBlockRootClientId( id );
			const currentItemIndex =
				getBlockOrder( listContainerId ).indexOf( id );

			// Move each nested list item to become a top-level item.
			block.innerBlocks.forEach( ( nestedBlock, index ) => {
				// Get the nested list container (first inner block should be core/list).
				const nestedListId = nestedBlock.clientId;
				const nestedListItems = getBlockOrder( nestedListId );

				// Move each nested list item to the parent list level.
				nestedListItems.forEach( ( nestedItemId, itemIndex ) => {
					moveBlocksToPosition(
						[ nestedItemId ],
						nestedListId,
						listContainerId,
						currentItemIndex +
							1 +
							index * nestedListItems.length +
							itemIndex
					);
				} );

				// Remove the now-empty nested list container.
				removeBlock( nestedListId );
			} );

			// Remove the empty parent list item.
			removeBlock( id );
		} );

		return true;
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
			const nextBlockClientId = getNextId( clientId );

			if ( ! nextBlockClientId ) {
				onMerge( forward );
				return;
			}

			if ( getParentListItemId( nextBlockClientId ) ) {
				outdentListItem( nextBlockClientId );
			} else {
				mergeWithNested( clientId, nextBlockClientId );
			}
		} else {
			// Check if this is an empty list item with nested children.
			if ( handleEmptyListItemWithChildren( clientId ) ) {
				return;
			}

			// Merging is only done from the top level. For lower levels, the
			// list item is outdented instead.
			const previousBlockClientId = getPreviousBlockClientId( clientId );
			if ( getParentListItemId( clientId ) ) {
				outdentListItem( clientId );
			} else if ( previousBlockClientId ) {
				const trailingId = getTrailingId( previousBlockClientId );
				mergeWithNested( trailingId, clientId );
			} else {
				onMerge( forward );
			}
		}
	};
}
