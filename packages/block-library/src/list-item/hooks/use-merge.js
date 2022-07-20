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

export default function useMerge( clientId ) {
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

	function getTrailing( id ) {
		const order = getBlockOrder( id );

		if ( ! order.length ) {
			return id;
		}

		return getTrailing( order[ order.length - 1 ] );
	}

	function getParentListItem( id ) {
		const listId = getBlockRootClientId( id );
		const parentListItem = getBlockRootClientId( listId );
		if ( ! parentListItem ) return;
		if ( getBlockName( parentListItem ) !== listItemName ) return;
		return parentListItem;
	}

	/**
	 * Return the next list item with respect to the given list item. If none,
	 * return the next list item of the parent list item if it exists.
	 *
	 * @param {string} id A list item client ID.
	 * @return {string?} The client ID of the next list item.
	 */
	function _getNext( id ) {
		const next = getNextBlockClientId( id );
		if ( next ) return next;
		const parentListItem = getParentListItem( id );
		if ( ! parentListItem ) return;
		return _getNext( parentListItem );
	}

	/**
	 * Given a client ID, return the client ID of the list item on the next
	 * line, regardless of indentation level.
	 *
	 * @param {string} id The client ID of the current list item.
	 * @return {string?} The client ID of the next list item.
	 */
	function getNext( id ) {
		const order = getBlockOrder( id );

		// If the list item does not have a nested list, return the next list
		// item.
		if ( ! order.length ) {
			return _getNext( id );
		}

		// Get the first list item in the nested list.
		return getBlockOrder( order[ 0 ] )[ 0 ];
	}

	return ( forward ) => {
		if ( forward ) {
			const nextBlockClientId = getNext( clientId );
			if ( ! nextBlockClientId ) return;
			if ( getParentListItem( nextBlockClientId ) ) {
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
			if ( getParentListItem( clientId ) ) {
				outdentListItem( clientId );
			} else if ( previousBlockClientId ) {
				const trailingClientId = getTrailing( previousBlockClientId );
				registry.batch( () => {
					moveBlocksToPosition(
						getBlockOrder( clientId ),
						clientId,
						previousBlockClientId
					);
					mergeBlocks( trailingClientId, clientId );
				} );
			}
		}
	};
}
