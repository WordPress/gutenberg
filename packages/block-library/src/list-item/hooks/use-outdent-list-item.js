import { useCallback, useRef, useEffect } from '@wordpress/element';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { cloneBlock } from '@wordpress/blocks';
import { unlock } from '../../lock-unlock';
import { restoreSelection } from './restore-selection';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export default function useOutdentListItem( clientId ) {
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
		getSelectionStart,
		getSelectionEnd,
	} = useSelect( blockEditorStore );

	// Outdenting moves the items, which remounts them and drops the native
	// selection. Keep the document to rebuild the selection afterwards.
	const element = useBlockElement( clientId );
	const ownerDocumentRef = useRef();
	useEffect( () => {
		ownerDocumentRef.current = element?.ownerDocument;
	}, [ element ] );

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
		const selectionStart = getSelectionStart();
		const selectionEnd = getSelectionEnd();

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

		restoreSelection(
			ownerDocumentRef.current,
			selectionStart,
			selectionEnd
		);

		return true;
	}, [] );
}
