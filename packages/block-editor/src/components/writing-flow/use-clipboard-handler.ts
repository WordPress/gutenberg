import {
	pasteHandler,
	findTransform,
	getBlockTransforms,
	hasBlockSupport,
	switchToBlockType,
} from '@wordpress/blocks';
import type { Block, BlockFilesTransform } from '@wordpress/blocks';
import {
	documentHasSelection,
	documentHasUncollapsedSelection,
	isEntirelySelected,
} from '@wordpress/dom';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { useNotifyCopy } from '../../utils/use-notify-copy';
import { setClipboardBlocks, setContentEditableWrapper } from './utils';
import { getPasteEventData } from '../../utils/pasting';
import { getBlockClientId } from '../../utils/dom';
import { getTextDropPoint } from '../rich-text/event-listeners/drag-and-drop';
import type { WritingFlowClipboardEvent } from './types';

/**
 * Whether the DOM selection entirely spans the content of the given block,
 * and the block's editable element is the block element itself, like a
 * heading or a paragraph, not a field within a larger block, like a caption.
 *
 * @param ownerDocument The block's document.
 * @param clientId      The block's client ID.
 *
 * @return Whether the block is entirely selected.
 */
function isBlockEntirelySelected( ownerDocument: Document, clientId: string ) {
	// The editor's document has a window with a selection.
	const selection = ownerDocument.defaultView!.getSelection()!;

	if ( getBlockClientId( selection.anchorNode ) !== clientId ) {
		return false;
	}

	const blockElement = ownerDocument.getElementById( `block-${ clientId }` );

	return (
		!! blockElement?.isContentEditable && isEntirelySelected( blockElement )
	);
}

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
		getBlockAttributes,
		getSelectionStart,
	} = useSelect( blockEditorStore );
	const {
		flashBlock,
		removeBlocks,
		replaceBlocks,
		__unstableDeleteSelection,
		__unstableExpandSelection,
		__unstableSplitSelection,
		selectionChange,
	} = useDispatch( blockEditorStore );
	const notifyCopy = useNotifyCopy();

	return useRefEffect< HTMLElement >( ( node ) => {
		// Text dropped is inserted the way it would be pasted at the drop
		// point.
		function moveSelectionToDropPoint( event: DragEvent ) {
			const point = getTextDropPoint( event );
			if (
				! point ||
				point.isOnDraggedText ||
				! node.contains( point.element )
			) {
				return false;
			}
			const { element, offset, range } = point;
			const host =
				element.parentElement?.closest< HTMLElement >(
					'[contenteditable]'
				);
			( host?.isContentEditable ? host : element ).focus();
			const selection =
				element.ownerDocument.defaultView!.getSelection()!;
			selection.removeAllRanges();
			selection.addRange( range );
			selectionChange(
				getBlockClientId( element )!,
				element.dataset.wpBlockAttributeKey,
				offset,
				offset
			);
			return true;
		}

		// A bound field's text belongs to its source, not to the block.
		function isSelectedFieldBound() {
			const { clientId, attributeKey } = getSelectionStart();
			const bindings = clientId
				? getBlockAttributes( clientId )?.metadata?.bindings
				: undefined;
			return !! (
				( attributeKey && bindings?.[ attributeKey ] ) ||
				bindings?.__default
			);
		}

		function handler( event: WritingFlowClipboardEvent ) {
			if ( event.defaultPrevented ) {
				// This was likely already handled in rich-text/use-paste-handler.js.
				return;
			}

			if (
				event.type === 'drop' &&
				! moveSelectionToDropPoint( event as DragEvent )
			) {
				return;
			}

			const selectedBlockClientIds = getSelectedBlockClientIds();

			if ( selectedBlockClientIds.length === 0 ) {
				return;
			}

			// Whether the entire content of a block whose editable element
			// is the block itself is selected: copying all of a heading's
			// text should copy the heading block. Fields within a larger
			// block, like a caption, are not the block element and keep
			// the native copy.
			// Whether the entire text of a single selected block is
			// copied, in which case the block itself is copied.
			const isWholeSingleBlockCopy =
				event.type === 'copy' &&
				! hasMultiSelection() &&
				! isSelectedFieldBound() &&
				isBlockEntirelySelected(
					( event.target as Element ).ownerDocument,
					selectedBlockClientIds[ 0 ]
				);

			// Let native copy/paste behaviour take over in input fields.
			// But always handle multiple selected blocks.
			if ( ! hasMultiSelection() ) {
				// Clipboard events reach the listener from elements.
				const { ownerDocument } = event.target as Element;
				// If copying, only consider actual text selection as selection.
				// Otherwise, any focus on an input field is considered.
				const hasSelection =
					event.type === 'copy' || event.type === 'cut'
						? documentHasUncollapsedSelection( ownerDocument )
						: documentHasSelection( ownerDocument ) &&
							! ( ownerDocument.activeElement as HTMLElement )
								.isContentEditable;

				// Let native copy behaviour take over in input fields.
				if ( hasSelection && ! isWholeSingleBlockCopy ) {
					return;
				}
			}

			const { activeElement } = ( event.target as Element ).ownerDocument;

			if ( ! node.contains( activeElement ) ) {
				return;
			}

			const isSelectionMergeable = __unstableIsSelectionMergeable();
			const shouldHandleWholeBlocks =
				__unstableIsSelectionCollapsed() ||
				__unstableIsFullySelected() ||
				isWholeSingleBlockCopy;
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
					let blocks: ( Block | null )[];
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

					// The selected blocks exist, and copy and cut events are
					// clipboard events.
					setClipboardBlocks(
						event as ClipboardEvent,
						blocks as Block[],
						registry
					);
				}
			}

			if ( event.type === 'cut' ) {
				// We need to also check if at the start we needed to
				// expand the selection, as in this point we might have
				// programmatically fully selected the blocks above.
				if ( shouldHandleWholeBlocks && ! expandSelectionIsNeeded ) {
					removeBlocks( selectedBlockClientIds );
				} else {
					setContentEditableWrapper(
						( event.target as Element ).ownerDocument
							.activeElement as HTMLElement,
						false
					);
					__unstableDeleteSelection();
				}
			} else if ( event.type === 'paste' || event.type === 'drop' ) {
				const {
					__experimentalCanUserUseUnfilteredHTML:
						canUserUseUnfilteredHTML,
					mediaUpload,
				} = getSettings();
				// Paste and drop events carry readable data.
				const clipboardData = (
					'dataTransfer' in event
						? event.dataTransfer
						: event.clipboardData
				)!;
				const isInternal =
					clipboardData.getData( 'rich-text' ) === 'true';
				if ( isInternal ) {
					return;
				}
				const { plainText, html, files } = getPasteEventData( {
					clipboardData,
				} )!;
				const isFullySelected = __unstableIsFullySelected();
				let blocks: Block[] | string = [];

				if ( files.length ) {
					if ( ! mediaUpload ) {
						event.preventDefault();
						return;
					}

					const fromTransforms = getBlockTransforms( 'from' );
					blocks = files
						.reduce< ( Block | Block[] )[] >(
							( accumulator, file ) => {
								const transformation = findTransform(
									fromTransforms,
									( transform ) =>
										transform.type === 'files' &&
										// Files transforms define a matcher.
										transform.isMatch!( [ file ] )
								);
								if ( transformation ) {
									accumulator.push(
										// The predicate only matches files transforms, which transform.
										(
											transformation as BlockFilesTransform
										 ).transform!( [ file ] )
									);
								}
								return accumulator;
							},
							[]
						)
						.flat();
				} else {
					blocks = pasteHandler( {
						HTML: html,
						plainText,
						mode: isFullySelected ? 'BLOCKS' : 'AUTO',
						// @ts-expect-error `pasteHandler` ignores this option.
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
						// The selected block has a name.
						getBlockName( selectedBlockClientIds[ 0 ] )!,
						'splitting',
						false
					) &&
					! event.__deprecatedOnSplit
				) {
					return;
				}

				// Pasting over an entirely selected block replaces it, the
				// equivalent of pasting into an empty block.
				if (
					! hasMultiSelection() &&
					isBlockEntirelySelected(
						( event.target as Element ).ownerDocument,
						selectedBlockClientIds[ 0 ]
					)
				) {
					replaceBlocks(
						selectedBlockClientIds,
						blocks,
						blocks.length - 1,
						-1
					);
					event.preventDefault();
					return;
				}

				const [ firstSelectedClientId ] = selectedBlockClientIds;
				const rootClientId = getBlockRootClientId(
					firstSelectedClientId
				);

				const newBlocks: Block[] = [];

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
								? // A block that cannot be inserted has a root block.
									switchToBlockType( block, rootBlockName! )
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
		node.ownerDocument.addEventListener( 'drop', handler, true );

		return () => {
			node.ownerDocument.removeEventListener( 'copy', handler );
			node.ownerDocument.removeEventListener( 'cut', handler );
			node.ownerDocument.removeEventListener( 'paste', handler );
			node.ownerDocument.removeEventListener( 'drop', handler, true );
		};
	}, [] );
}
