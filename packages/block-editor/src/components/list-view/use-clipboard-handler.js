/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useNotifyCopy } from '../../utils/use-notify-copy';
import { focusListItem } from './utils';
import { getPasteBlocks, setClipboardBlocks } from '../writing-flow/utils';

// This hook borrows from useClipboardHandler in ../writing-flow/use-clipboard-handler.js
// and adds behaviour for the list view, while skipping partial selection.
export default function useClipboardHandler( { selectBlock } ) {
	const {
		getBlockOrder,
		getBlockRootClientId,
		getBlocksByClientId,
		getPreviousBlockClientId,
		getSelectedBlockClientIds,
		getSettings,
		canInsertBlockType,
		canRemoveBlocks,
	} = useSelect( blockEditorStore );
	const { flashBlock, removeBlocks, replaceBlocks, insertBlocks } =
		useDispatch( blockEditorStore );
	const notifyCopy = useNotifyCopy();

	return useRefEffect( ( node ) => {
		function updateFocusAndSelection( focusClientId, shouldSelectBlock ) {
			if ( shouldSelectBlock ) {
				selectBlock( undefined, focusClientId, null, null );
			}

			focusListItem( focusClientId, node );
		}

		// Determine which blocks to update:
		// If the current (focused) block is part of the block selection, use the whole selection.
		// If the focused block is not part of the block selection, only update the focused block.
		function getBlocksToUpdate( clientId ) {
			const selectedBlockClientIds = getSelectedBlockClientIds();
			const isUpdatingSelectedBlocks =
				selectedBlockClientIds.includes( clientId );
			const firstBlockClientId = isUpdatingSelectedBlocks
				? selectedBlockClientIds[ 0 ]
				: clientId;
			const firstBlockRootClientId =
				getBlockRootClientId( firstBlockClientId );

			const blocksToUpdate = isUpdatingSelectedBlocks
				? selectedBlockClientIds
				: [ clientId ];

			return {
				blocksToUpdate,
				firstBlockClientId,
				firstBlockRootClientId,
				originallySelectedBlockClientIds: selectedBlockClientIds,
			};
		}

		function handler( event ) {
			if ( event.defaultPrevented ) {
				// This was possibly already handled in rich-text/use-paste-handler.js.
				return;
			}

			// Only handle events that occur within the list view.
			if ( ! node.contains( event.target.ownerDocument.activeElement ) ) {
				return;
			}

			// Retrieve the block clientId associated with the focused list view row.
			// This enables applying copy / cut / paste behavior to the focused block,
			// rather than just the blocks that are currently selected.
			const listViewRow =
				event.target.ownerDocument.activeElement?.closest(
					'[role=row]'
				);
			const clientId = listViewRow?.dataset?.block;
			if ( ! clientId ) {
				return;
			}

			const {
				blocksToUpdate: selectedBlockClientIds,
				firstBlockClientId,
				firstBlockRootClientId,
				originallySelectedBlockClientIds,
			} = getBlocksToUpdate( clientId );

			if ( selectedBlockClientIds.length === 0 ) {
				return;
			}

			event.preventDefault();

			if ( event.type === 'copy' || event.type === 'cut' ) {
				if ( selectedBlockClientIds.length === 1 ) {
					flashBlock( selectedBlockClientIds[ 0 ] );
				}

				notifyCopy( event.type, selectedBlockClientIds );
				const blocks = getBlocksByClientId( selectedBlockClientIds );
				setClipboardBlocks( event, blocks );
			}

			if ( event.type === 'cut' ) {
				// Don't update the selection if the blocks cannot be deleted.
				if (
					! canRemoveBlocks(
						selectedBlockClientIds,
						firstBlockRootClientId
					)
				) {
					return;
				}

				let blockToFocus =
					getPreviousBlockClientId( firstBlockClientId ) ??
					// If the previous block is not found (when the first block is deleted),
					// fallback to focus the parent block.
					firstBlockRootClientId;

				// Remove blocks, but don't update selection, and it will be handled below.
				removeBlocks( selectedBlockClientIds, false );

				// Update the selection if the original selection has been removed.
				const shouldUpdateSelection =
					originallySelectedBlockClientIds.length > 0 &&
					getSelectedBlockClientIds().length === 0;

				// If there's no previous block nor parent block, focus the first block.
				if ( ! blockToFocus ) {
					blockToFocus = getBlockOrder()[ 0 ];
				}

				updateFocusAndSelection( blockToFocus, shouldUpdateSelection );
			} else if ( event.type === 'paste' ) {
				const {
					__experimentalCanUserUseUnfilteredHTML:
						canUserUseUnfilteredHTML,
				} = getSettings();
				const blocks = getPasteBlocks(
					event,
					canUserUseUnfilteredHTML
				);

				if ( selectedBlockClientIds.length === 1 ) {
					const [ selectedBlockClientId ] = selectedBlockClientIds;

					// If a single block is focused, and the blocks to be posted can
					// be inserted within the block, then append the pasted blocks
					// within the focused block. For example, if you have copied a paragraph
					// block and paste it within a single Group block, this will append
					// the paragraph block within the Group block.
					if (
						blocks.every( ( block ) =>
							canInsertBlockType(
								block.name,
								selectedBlockClientId
							)
						)
					) {
						insertBlocks(
							blocks,
							undefined,
							selectedBlockClientId
						);
						updateFocusAndSelection( blocks[ 0 ]?.clientId, false );
						return;
					}
				}

				replaceBlocks(
					selectedBlockClientIds,
					blocks,
					blocks.length - 1,
					-1
				);
				updateFocusAndSelection( blocks[ 0 ]?.clientId, false );
			}
		}

		node.ownerDocument.addEventListener( 'copy', handler );
		node.ownerDocument.addEventListener( 'cut', handler );
		node.ownerDocument.addEventListener( 'paste', handler );

		return () => {
			node.ownerDocument.removeEventListener( 'copy', handler );
			node.ownerDocument.removeEventListener( 'cut', handler );
			node.ownerDocument.removeEventListener( 'paste', handler );
		};
	}, [] );
}
