import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { cloneBlock } from '@wordpress/blocks';

export default function useOutdentListItem() {
	const registry = useRegistry();
	const { moveBlocksToPosition, removeBlock, removeBlocks, insertBlock } =
		useDispatch( blockEditorStore );
	const {
		getBlockRootClientId,
		getBlockName,
		getBlockOrder,
		getBlockIndex,
		getSelectedBlockClientIds,
		getBlock,
	} = useSelect( blockEditorStore );

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

	return useCallback( ( clientIds = getSelectedBlockClientIds() ) => {
		if ( ! Array.isArray( clientIds ) ) {
			clientIds = [ clientIds ];
		}

		if ( ! clientIds.length ) {
			return;
		}

		const firstClientId = clientIds[ 0 ];

		// Can't outdent if it's not a list item.
		if ( getBlockName( firstClientId ) !== 'core/list-item' ) {
			return;
		}

		const parentListItemId = getParentListItemId( firstClientId );

		// Can't outdent if it's at the top level.
		if ( ! parentListItemId ) {
			return;
		}

		const parentListId = getBlockRootClientId( firstClientId );
		const lastClientId = clientIds[ clientIds.length - 1 ];
		const order = getBlockOrder( parentListId );
		const followingListItems = order.slice(
			getBlockIndex( lastClientId ) + 1
		);

		registry.batch( () => {
			if ( followingListItems.length ) {
				const nestedListId = getBlockOrder( firstClientId )[ 0 ];

				if ( nestedListId ) {
					moveBlocksToPosition(
						followingListItems,
						parentListId,
						nestedListId
					);
				} else {
					// Insert the list with the items already inside: an
					// empty list would be scaffolded with the list block
					// type's template at insertion. Removing the items
					// first frees them to be reinserted with their client
					// IDs kept.
					const nestedListBlock = cloneBlock(
						getBlock( parentListId ),
						{},
						followingListItems.map( ( id ) => getBlock( id ) )
					);
					removeBlocks( followingListItems, false );
					insertBlock( nestedListBlock, 0, firstClientId, false );
				}
			}
			moveBlocksToPosition(
				clientIds,
				parentListId,
				getBlockRootClientId( parentListItemId ),
				getBlockIndex( parentListItemId ) + 1
			);
			if ( ! getBlockOrder( parentListId ).length ) {
				const shouldSelectParent = false;
				removeBlock( parentListId, shouldSelectParent );
			}
		} );

		return true;
	}, [] );
}
