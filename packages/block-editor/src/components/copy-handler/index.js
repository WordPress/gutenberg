/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import {
	serialize,
	pasteHandler,
	store as blocksStore,
} from '@wordpress/blocks';
import {
	documentHasSelection,
	documentHasUncollapsedSelection,
} from '@wordpress/dom';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getPasteEventData } from '../../utils/pasting';
import { store as blockEditorStore } from '../../store';

export function useNotifyCopy() {
	const { getBlockName } = useSelect( blockEditorStore );
	const { getBlockType } = useSelect( blocksStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	return useCallback( ( eventType, selectedBlockClientIds ) => {
		let notice = '';
		if ( selectedBlockClientIds.length === 1 ) {
			const clientId = selectedBlockClientIds[ 0 ];
			const title = getBlockType( getBlockName( clientId ) )?.title;
			notice =
				eventType === 'copy'
					? sprintf(
							// Translators: Name of the block being copied, e.g. "Paragraph".
							__( 'Copied "%s" to clipboard.' ),
							title
					  )
					: sprintf(
							// Translators: Name of the block being cut, e.g. "Paragraph".
							__( 'Moved "%s" to clipboard.' ),
							title
					  );
		} else {
			notice =
				eventType === 'copy'
					? sprintf(
							// Translators: %d: Number of blocks being copied.
							_n(
								'Copied %d block to clipboard.',
								'Copied %d blocks to clipboard.',
								selectedBlockClientIds.length
							),
							selectedBlockClientIds.length
					  )
					: sprintf(
							// Translators: %d: Number of blocks being cut.
							_n(
								'Moved %d block to clipboard.',
								'Moved %d blocks to clipboard.',
								selectedBlockClientIds.length
							),
							selectedBlockClientIds.length
					  );
		}
		createSuccessNotice( notice, {
			type: 'snackbar',
		} );
	}, [] );
}

export function useClipboardHandler() {
	const {
		getBlocksByClientId,
		getSelectedBlockClientIds,
		hasMultiSelection,
		getSettings,
		__unstableIsFullySelected,
		__unstableIsSelectionCollapsed,
		__unstableIsSelectionMergeable,
		__unstableGetSelectedBlocksWithPartialSelection,
	} = useSelect( blockEditorStore );
	const {
		flashBlock,
		removeBlocks,
		replaceBlocks,
		__unstableDeleteSelection,
		__unstableExpandSelection,
	} = useDispatch( blockEditorStore );
	const notifyCopy = useNotifyCopy();

	return useRefEffect( ( node ) => {
		function handler( event ) {
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

			const eventDefaultPrevented = event.defaultPrevented;
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
						const [
							head,
							tail,
						] = __unstableGetSelectedBlocksWithPartialSelection();
						const inBetweenBlocks = getBlocksByClientId(
							selectedBlockClientIds.slice(
								1,
								selectedBlockClientIds.length - 1
							)
						);
						blocks = [ head, ...inBetweenBlocks, tail ];
					}
					const serialized = serialize( blocks );

					event.clipboardData.setData( 'text/plain', serialized );
					event.clipboardData.setData( 'text/html', serialized );
				}
			}

			if ( event.type === 'cut' ) {
				// We need to also check if at the start we needed to
				// expand the selection, as in this point we might have
				// programmatically fully selected the blocks above.
				if ( shouldHandleWholeBlocks && ! expandSelectionIsNeeded ) {
					removeBlocks( selectedBlockClientIds );
				} else {
					__unstableDeleteSelection();
				}
			} else if ( event.type === 'paste' ) {
				if ( eventDefaultPrevented ) {
					// This was likely already handled in rich-text/use-paste-handler.js.
					return;
				}
				const {
					__experimentalCanUserUseUnfilteredHTML: canUserUseUnfilteredHTML,
				} = getSettings();
				const { plainText, html } = getPasteEventData( event );
				const blocks = pasteHandler( {
					HTML: html,
					plainText,
					mode: 'BLOCKS',
					canUserUseUnfilteredHTML,
				} );

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

function CopyHandler( { children } ) {
	return <div ref={ useClipboardHandler() }>{ children }</div>;
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/copy-handler/README.md
 */
export default CopyHandler;
