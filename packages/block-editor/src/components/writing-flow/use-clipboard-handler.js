/**
 * WordPress dependencies
 */
import {
	pasteHandler,
	findTransform,
	getBlockTransforms,
	hasBlockSupport,
	switchToBlockType,
} from '@wordpress/blocks';
import {
	documentHasSelection,
	documentHasUncollapsedSelection,
} from '@wordpress/dom';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useNotifyCopy } from '../../utils/use-notify-copy';
import { setClipboardBlocks } from './utils';
import { getPasteEventData } from '../../utils/pasting';

export default function useClipboardHandler() {
	const registry = useRegistry();
	const {
		getBlocksByClientId,
		getSelectedBlockClientIds,
		hasMultiSelection,
		getSettings,
		getBlockName,
		__unstableIsFullySelected,
		__unstableIsSelectionCollapsed,
		__unstableIsSelectionMergeable,
		__unstableGetSelectedBlocksWithPartialSelection,
		canInsertBlockType,
		getBlockRootClientId,
	} = useSelect( blockEditorStore );
	const {
		flashBlock,
		removeBlocks,
		replaceBlocks,
		__unstableDeleteSelection,
		__unstableExpandSelection,
		__unstableSplitSelection,
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

			// Let native copy/paste behaviour take over in input fields.
			// But always handle multiple selected blocks.
			if ( ! hasMultiSelection() ) {
				const { target } = event;
				const { ownerDocument } = target;
				// If copying, only consider actual text selection as selection.
				// Otherwise, any focus on an input field is considered.
				const hasSelection =
					event.type === 'copy' || event.type === 'cut'
						? documentHasUncollapsedSelection( ownerDocument )
						: documentHasSelection( ownerDocument ) &&
						  ! ownerDocument.activeElement.isContentEditable;

				// Let native copy behaviour take over in input fields.
				if ( hasSelection ) {
					return;
				}
			}

			const { activeElement } = event.target.ownerDocument;

			if ( ! node.contains( activeElement ) ) {
				return;
			}

			const isSelectionMergeable = __unstableIsSelectionMergeable();
			const shouldHandleWholeBlocks =
				__unstableIsSelectionCollapsed() || __unstableIsFullySelected();
			const expandSelectionIsNeeded =
				! shouldHandleWholeBlocks && ! isSelectionMergeable;
			if ( event.type === 'copy' || event.type === 'cut' ) {
				event.preventDefault();

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

					setClipboardBlocks( event, blocks, registry );
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
				const isInternal =
					event.clipboardData.getData( 'rich-text' ) === 'true';
				if ( isInternal ) {
					return;
				}
				const { plainText, html, files } = getPasteEventData( event );
				const isFullySelected = __unstableIsFullySelected();
				let blocks = [];

				if ( files.length ) {
					const fromTransforms = getBlockTransforms( 'from' );
					blocks = files
						.reduce( ( accumulator, file ) => {
							const transformation = findTransform(
								fromTransforms,
								( transform ) =>
									transform.type === 'files' &&
									transform.isMatch( [ file ] )
							);
							if ( transformation ) {
								accumulator.push(
									transformation.transform( [ file ] )
								);
							}
							return accumulator;
						}, [] )
						.flat();
				} else {
					blocks = pasteHandler( {
						HTML: html,
						plainText,
						mode: isFullySelected ? 'BLOCKS' : 'AUTO',
						canUserUseUnfilteredHTML,
					} );
				}

				// Inline paste: let rich text handle it.
				if ( typeof blocks === 'string' ) {
					return;
				}

				if ( isFullySelected ) {
					replaceBlocks(
						selectedBlockClientIds,
						blocks,
						blocks.length - 1,
						-1
					);
					event.preventDefault();
					return;
				}

				// If a block doesn't support splitting, let rich text paste
				// inline.
				if (
					! hasMultiSelection() &&
					! hasBlockSupport(
						getBlockName( selectedBlockClientIds[ 0 ] ),
						'splitting',
						false
					) &&
					! event.__deprecatedOnSplit
				) {
					return;
				}

				const [ firstSelectedClientId ] = selectedBlockClientIds;
				const rootClientId = getBlockRootClientId(
					firstSelectedClientId
				);

				const newBlocks = [];

				for ( const block of blocks ) {
					if ( canInsertBlockType( block.name, rootClientId ) ) {
						newBlocks.push( block );
					} else {
						// If a block cannot be inserted in a root block, try
						// converting it to that root block type and insert the
						// inner blocks.
						// Example: paragraphs cannot be inserted into a list,
						// so convert the paragraphs to a list for list items.
						const rootBlockName = getBlockName( rootClientId );
						const switchedBlocks =
							block.name !== rootBlockName
								? switchToBlockType( block, rootBlockName )
								: [ block ];

						if ( ! switchedBlocks ) {
							return;
						}

						for ( const switchedBlock of switchedBlocks ) {
							for ( const innerBlock of switchedBlock.innerBlocks ) {
								newBlocks.push( innerBlock );
							}
						}
					}
				}

				__unstableSplitSelection( newBlocks );
				event.preventDefault();
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
