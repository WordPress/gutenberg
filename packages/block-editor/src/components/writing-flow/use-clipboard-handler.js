/**
 * WordPress dependencies
 */
import {
	documentHasSelection,
	documentHasUncollapsedSelection,
} from '@wordpress/dom';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useNotifyCopy } from '../../utils/use-notify-copy';
import { getPasteBlocks, setClipboardBlocks } from './utils';

export default function useClipboardHandler() {
	const {
		getBlocksByClientId,
		getSelectedBlockClientIds,
		hasMultiSelection,
		getSettings,
		__unstableIsFullySelected,
		__unstableIsSelectionCollapsed,
		__unstableIsSelectionMergeable,
		__unstableGetSelectedBlocksWithPartialSelection,
		canInsertBlockType,
	} = useSelect( blockEditorStore );
	const {
		flashBlock,
		removeBlocks,
		replaceBlocks,
		__unstableDeleteSelection,
		__unstableExpandSelection,
		insertBlocks,
	} = useDispatch( blockEditorStore );
	const notifyCopy = useNotifyCopy();

	return useRefEffect( ( node ) => {
		function handler( event ) {
			if ( event.defaultPrevented ) {
				// This was likely already handled in rich-text/use-paste-handler.js.
				return;
			}

			const selectedBlockClientIds = getSelectedBlockClientIds();

			if ( selectedBlockClientIds.length === 0 ) {
				return;
			}

			// Always handle multiple selected blocks.
			if ( ! hasMultiSelection() ) {
				const { target } = event;
				const { ownerDocument } = target;
				// If copying, only consider actual text selection as selection.
				// Otherwise, any focus on an input field is considered.
				const hasSelection =
					event.type === 'copy' || event.type === 'cut'
						? documentHasUncollapsedSelection( ownerDocument )
						: documentHasSelection( ownerDocument );

				// Let native copy behaviour take over in input fields.
				if ( hasSelection ) {
					return;
				}
			}

			if ( ! node.contains( event.target.ownerDocument.activeElement ) ) {
				return;
			}

			event.preventDefault();

			const isSelectionMergeable = __unstableIsSelectionMergeable();
			const shouldHandleWholeBlocks =
				__unstableIsSelectionCollapsed() || __unstableIsFullySelected();
			const expandSelectionIsNeeded =
				! shouldHandleWholeBlocks && ! isSelectionMergeable;
			if ( event.type === 'copy' || event.type === 'cut' ) {
				if ( selectedBlockClientIds.length === 1 ) {
					flashBlock( selectedBlockClientIds[ 0 ] );
				}
				// If we have a partial selection that is not mergeable, just
				// expand the selection to the whole blocks.
				if ( expandSelectionIsNeeded ) {
					__unstableExpandSelection();
				} else {
					notifyCopy( event.type, selectedBlockClientIds );
					let blocks;
					// Check if we have partial selection.
					if ( shouldHandleWholeBlocks ) {
						blocks = getBlocksByClientId( selectedBlockClientIds );
					} else {
						const [ head, tail ] =
							__unstableGetSelectedBlocksWithPartialSelection();
						const inBetweenBlocks = getBlocksByClientId(
							selectedBlockClientIds.slice(
								1,
								selectedBlockClientIds.length - 1
							)
						);
						blocks = [ head, ...inBetweenBlocks, tail ];
					}

					setClipboardBlocks( event, blocks );
				}
			}

			if ( event.type === 'cut' ) {
				// We need to also check if at the start we needed to
				// expand the selection, as in this point we might have
				// programmatically fully selected the blocks above.
				if ( shouldHandleWholeBlocks && ! expandSelectionIsNeeded ) {
					removeBlocks( selectedBlockClientIds );
				} else {
					event.target.ownerDocument.activeElement.contentEditable = false;
					__unstableDeleteSelection();
				}
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
						return;
					}
				}

				replaceBlocks(
					selectedBlockClientIds,
					blocks,
					blocks.length - 1,
					-1
				);
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
