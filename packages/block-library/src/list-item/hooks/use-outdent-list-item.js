import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { moveBlocksToNestedList } from './move-blocks-to-nested-list';

export default function useOutdentListItem() {
	const registry = useRegistry();
	const { moveBlocksToPosition, removeBlock } =
		useDispatch( blockEditorStore );
	const {
		getBlockRootClientId,
		getBlockName,
		getBlockOrder,
		getBlockIndex,
		getSelectedBlockClientIds,
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
				// Nest the items that follow under the outdented item so they
				// keep their place below it.
				moveBlocksToNestedList(
					registry,
					followingListItems,
					parentListId,
					firstClientId
				);
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
