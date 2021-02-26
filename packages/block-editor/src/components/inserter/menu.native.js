/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	createBlock,
	rawHandler,
	store as blocksStore,
} from '@wordpress/blocks';
import { getClipboard } from '@wordpress/components';

/**
 * Internal dependencies
 */

import InserterSearchResults from './search-results';
import { store as blockEditorStore } from '../../store';

function InserterMenu( {
	onSelect,
	onDismiss,
	rootClientId,
	clientId,
	isAppender,
	shouldReplaceBlock,
	insertionIndex,
} ) {
	const {
		showInsertionPoint,
		hideInsertionPoint,
		clearSelectedBlock,
		insertBlock,
		removeBlock,
		resetBlocks,
		insertDefaultBlock,
	} = useDispatch( blockEditorStore );

	const {
		items,
		destinationRootClientId,
		getBlockOrder,
		getBlockCount,
		canInsertBlockType,
	} = useSelect( ( select ) => {
		const {
			getInserterItems,
			getBlockRootClientId,
			getBlockSelectionEnd,
			...selectBlockEditorStore
		} = select( blockEditorStore );

		let targetRootClientId = rootClientId;
		if ( ! targetRootClientId && ! clientId && ! isAppender ) {
			const end = getBlockSelectionEnd();
			if ( end ) {
				targetRootClientId = getBlockRootClientId( end ) || undefined;
			}
		}

		return {
			items: getInserterItems( targetRootClientId ),
			destinationRootClientId: targetRootClientId,
			getBlockOrder: selectBlockEditorStore.getBlockOrder,
			getBlockCount: selectBlockEditorStore.getBlockCount,
			canInsertBlockType: selectBlockEditorStore.canInsertBlockType,
		};
	} );

	const { getBlockType } = useSelect( ( select ) => select( blocksStore ) );

	useEffect( () => {
		if ( shouldReplaceBlock ) {
			const count = getBlockCount();
			// Check if there is a rootClientId because that means it is a nested replaceable block
			// and we don't want to clear/reset all blocks.
			if ( count === 1 && ! rootClientId ) {
				// Removing the last block is not possilble with `removeBlock` action.
				// It always inserts a default block if the last of the blocks have been removed.
				clearSelectedBlock();
				resetBlocks( [] );
			} else {
				const blockToReplace = getBlockOrder( destinationRootClientId )[
					insertionIndex
				];
				removeBlock( blockToReplace, false );
			}
		}
		// Show/Hide insertion point on Mount/Dismount
		showInsertionPoint( destinationRootClientId, insertionIndex );
		return hideInsertionPoint;
	}, [] );

	const onClose = useCallback( () => {
		// If should replace but didn't insert any block
		// re-insert default block.
		if ( shouldReplaceBlock ) {
			insertDefaultBlock( {}, destinationRootClientId, insertionIndex );
		}
		onDismiss();
	}, [ shouldReplaceBlock, destinationRootClientId, insertionIndex ] );

	const onInsert = useCallback(
		( item ) => {
			const { name, initialAttributes, innerBlocks } = item;

			const newBlock = createBlock(
				name,
				initialAttributes,
				innerBlocks
			);

			insertBlock( newBlock, insertionIndex, destinationRootClientId );
		},
		[ insertBlock, destinationRootClientId, insertionIndex ]
	);

	/**
	 * Processes the inserter items to check
	 * if there's any copied block in the clipboard
	 * to add it as an extra item
	 */
	function getItems() {
		// Filter out reusable blocks (they will be added in another tab)
		const itemsToDisplay = items.filter(
			( { name } ) => name !== 'core/block'
		);

		const clipboard = getClipboard();
		let clipboardBlock = rawHandler( { HTML: clipboard } )[ 0 ];

		const canAddClipboardBlock = canInsertBlockType(
			clipboardBlock?.name,
			destinationRootClientId
		);

		if ( ! canAddClipboardBlock ) {
			return itemsToDisplay;
		}

		const { icon, name } = getBlockType( clipboardBlock.name );
		const { attributes: initialAttributes, innerBlocks } = clipboardBlock;

		clipboardBlock = {
			id: 'clipboard',
			name,
			icon,
			initialAttributes,
			innerBlocks,
		};

		return [ clipboardBlock, ...itemsToDisplay ];
	}

	return (
		<InserterSearchResults
			onClose={ onClose }
			items={ getItems() }
			onSelect={ ( item ) => {
				onInsert( item );
				onSelect( item );
			} }
		/>
	);
}

export default InserterMenu;
