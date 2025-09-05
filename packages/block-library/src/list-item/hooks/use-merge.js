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
	} = useSelect( blockEditorStore );
	const { mergeBlocks, moveBlocksToPosition } =
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
			// Merging is only done from the top level. For lowel levels, the
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
