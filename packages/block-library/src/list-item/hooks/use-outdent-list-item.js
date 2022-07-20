/**
 * External dependencies
 */
import { first, last, castArray } from 'lodash';

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

	function getParentListItem( id ) {
		const listId = getBlockRootClientId( id );
		const parentListItem = getBlockRootClientId( listId );
		if ( ! parentListItem ) return;
		if ( getBlockName( parentListItem ) !== listItemName ) return;
		return parentListItem;
	}

	return [
		canOutdent,
		useCallback( ( clientIds = getSelectedBlockClientIds() ) => {
			clientIds = castArray( clientIds );

			if ( ! clientIds.length ) return;

			const firstClientId = first( clientIds );

			// Can't outdent if it's not a list item.
			if ( getBlockName( firstClientId ) !== listItemName ) return;

			const parentListItem = getParentListItem( firstClientId );

			// Can't outdent if it's at the top level.
			if ( ! parentListItem ) return;

			const parentList = getBlockRootClientId( firstClientId );
			const lastClientId = last( clientIds );
			const order = getBlockOrder( parentList );
			const followingListItems = order.slice(
				getBlockIndex( lastClientId ) + 1
			);

			registry.batch( () => {
				if ( followingListItems.length ) {
					let nestedList = first( getBlockOrder( firstClientId ) );

					if ( ! nestedList ) {
						const nestedListBlock = cloneBlock(
							getBlock( parentList ),
							{},
							[]
						);
						nestedList = nestedListBlock.clientId;
						insertBlock( nestedListBlock, 0, firstClientId, false );
						// Immediately update the block list settings, otherwise
						// blocks can't be moved here due to canInsert checks.
						updateBlockListSettings(
							nestedList,
							getBlockListSettings( parentList )
						);
					}

					moveBlocksToPosition(
						followingListItems,
						parentList,
						nestedList
					);
				}
				moveBlocksToPosition(
					clientIds,
					parentList,
					getBlockRootClientId( parentListItem ),
					getBlockIndex( parentListItem ) + 1
				);
				if ( ! getBlockOrder( parentList ).length ) {
					removeBlock( parentList );
				}
			} );
		}, [] ),
	];
}
