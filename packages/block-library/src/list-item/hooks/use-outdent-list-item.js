/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { cloneBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { name as listItemName } from '../block.json';

export default function useOutdentListItem( clientId ) {
	const registry = useRegistry();
	const { canOutdent } = useSelect(
		( innerSelect ) => {
			const { getBlockRootClientId, getBlockName } =
				innerSelect( blockEditorStore );
			const grandParentId = getBlockRootClientId(
				getBlockRootClientId( clientId )
			);
			const grandParentName = getBlockName( grandParentId );
			const isListItem = grandParentName === listItemName;

			return {
				canOutdent: isListItem,
			};
		},
		[ clientId ]
	);
	const {
		moveBlocksToPosition,
		removeBlock,
		insertBlock,
		updateBlockListSettings,
	} = useDispatch( blockEditorStore );
	const {
		getBlockRootClientId,
		getBlockName,
		getBlockOrder,
		getBlockIndex,
		getSelectedBlockClientIds,
		getBlock,
		getBlockListSettings,
	} = useSelect( blockEditorStore );

	function getParentListItemId( id ) {
		const listId = getBlockRootClientId( id );
		const parentListItemId = getBlockRootClientId( listId );
		if ( ! parentListItemId ) return;
		if ( getBlockName( parentListItemId ) !== listItemName ) return;
		return parentListItemId;
	}

	return [
		canOutdent,
		useCallback( ( clientIds = getSelectedBlockClientIds() ) => {
			if ( ! Array.isArray( clientIds ) ) {
				clientIds = [ clientIds ];
			}

			if ( ! clientIds.length ) return;

			const firstClientId = clientIds[ 0 ];

			// Can't outdent if it's not a list item.
			if ( getBlockName( firstClientId ) !== listItemName ) return;

			const parentListItemId = getParentListItemId( firstClientId );

			// Can't outdent if it's at the top level.
			if ( ! parentListItemId ) return;

			const parentListId = getBlockRootClientId( firstClientId );
			const lastClientId = clientIds[ clientIds.length - 1 ];
			const order = getBlockOrder( parentListId );
			const followingListItems = order.slice(
				getBlockIndex( lastClientId ) + 1
			);

			registry.batch( () => {
				if ( followingListItems.length ) {
					let nestedListId = getBlockOrder( firstClientId )[ 0 ];

					if ( ! nestedListId ) {
						const nestedListBlock = cloneBlock(
							getBlock( parentListId ),
							{},
							[]
						);
						nestedListId = nestedListBlock.clientId;
						insertBlock( nestedListBlock, 0, firstClientId, false );
						// Immediately update the block list settings, otherwise
						// blocks can't be moved here due to canInsert checks.
						updateBlockListSettings(
							nestedListId,
							getBlockListSettings( parentListId )
						);
					}

					moveBlocksToPosition(
						followingListItems,
						parentListId,
						nestedListId
					);
				}
				moveBlocksToPosition(
					clientIds,
					parentListId,
					getBlockRootClientId( parentListItemId ),
					getBlockIndex( parentListItemId ) + 1
				);
				if ( ! getBlockOrder( parentListId ).length ) {
					removeBlock( parentListId );
				}
			} );
		}, [] ),
	];
}
