/**
 * WordPress dependencies
 */
import { useRegistry, useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useOutdentListItem from './use-outdent-list-item';

import { name as listItemName } from '../block.json';

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
	const [ , outdentListItem ] = useOutdentListItem( clientId );

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
		if ( ! parentListItemId ) return;
		if ( getBlockName( parentListItemId ) !== listItemName ) return;
		return parentListItemId;
	}

	/**
	 * Return the next list item with respect to the given list item. If none,
	 * return the next list item of the parent list item if it exists.
	 *
	 * @param {string} id A list item client ID.
	 * @return {string?} The client ID of the next list item.
	 */
	function _getNextId( id ) {
		const next = getNextBlockClientId( id );
		if ( next ) return next;
		const parentListItemId = getParentListItemId( id );
		if ( ! parentListItemId ) return;
		return _getNextId( parentListItemId );
	}

	/**
	 * Given a client ID, return the client ID of the list item on the next
	 * line, regardless of indentation level.
	 *
	 * @param {string} id The client ID of the current list item.
	 * @return {string?} The client ID of the next list item.
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
		if ( forward ) {
			const nextBlockClientId = getNextId( clientId );

			if ( ! nextBlockClientId ) {
				onMerge( forward );
				return;
			}

			if ( getParentListItemId( nextBlockClientId ) ) {
				outdentListItem( nextBlockClientId );
			} else {
				registry.batch( () => {
					moveBlocksToPosition(
						getBlockOrder( nextBlockClientId ),
						nextBlockClientId,
						getPreviousBlockClientId( nextBlockClientId )
					);
					mergeBlocks( clientId, nextBlockClientId );
				} );
			}
		} else {
			// Merging is only done from the top level. For lowel levels, the
			// list item is outdented instead.
			const previousBlockClientId = getPreviousBlockClientId( clientId );
			if ( getParentListItemId( clientId ) ) {
				outdentListItem( clientId );
			} else if ( previousBlockClientId ) {
				const trailingId = getTrailingId( previousBlockClientId );
				registry.batch( () => {
					// When merging a list item with a previous trailing list
					// item, we also need to move any nested list items. First,
					// check if there's a listed list. If there's a nested list,
					// append its nested list items to the trailing list.
					const [ nestedListClientId ] = getBlockOrder( clientId );
					if ( nestedListClientId ) {
						moveBlocksToPosition(
							getBlockOrder( nestedListClientId ),
							nestedListClientId,
							getBlockRootClientId( trailingId )
						);
					}
					mergeBlocks( trailingId, clientId );
				} );
			} else {
				onMerge( forward );
			}
		}
	};
}
