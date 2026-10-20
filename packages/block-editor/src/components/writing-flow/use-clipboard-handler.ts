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

interface PastedBlocks {
	blocks: Block[];
	replace: boolean;
}

/**
 * Returns the blocks pasted content is inserted as at the selection, and
 * whether they replace the selected blocks or split the selection. Returns
 * nothing when rich text inserts the content inline.
 *
 * @param registry                   Data registry.
 * @param data                       Pasted content.
 * @param data.html                  HTML content.
 * @param data.plainText             Plain text content.
 * @param data.files                 Files.
 * @param data.isEntireBlockSelected Whether the text of the single
 *                                   selected block is entirely selected.
 * @param data.__deprecatedOnSplit   Whether rich text has a legacy split
 *                                   handler.
 *
 * @return The blocks to insert.
 */
function getPastedBlocks(
	registry: ReturnType< typeof useRegistry >,
	{
		html,
		plainText,
		files,
		isEntireBlockSelected,
		__deprecatedOnSplit,
	}: {
		html?: string;
		plainText?: string;
		files: File[];
		isEntireBlockSelected: boolean;
		__deprecatedOnSplit?: unknown;
	}
): PastedBlocks | undefined {
	const {
		getSettings,
		getSelectedBlockClientIds,
		hasMultiSelection,
		getBlockName,
		getBlockRootClientId,
		canInsertBlockType,
		__unstableIsFullySelected,
	} = registry.select( blockEditorStore );
	const { __experimentalCanUserUseUnfilteredHTML: canUserUseUnfilteredHTML } =
		getSettings();
	const isFullySelected = __unstableIsFullySelected();
	let blocks: Block[] | string = [];

	if ( files.length ) {
		const fromTransforms = getBlockTransforms( 'from' );
		blocks = files
			.reduce< ( Block | Block[] )[] >( ( accumulator, file ) => {
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
						( transformation as BlockFilesTransform ).transform!( [
							file,
						] )
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
			// @ts-expect-error `pasteHandler` ignores this option.
			canUserUseUnfilteredHTML,
		} );
	}

	// Inline paste: let rich text handle it.
	if ( typeof blocks === 'string' ) {
		return;
	}

	if ( isFullySelected ) {
		return { blocks, replace: true };
	}

	const selectedBlockClientIds = getSelectedBlockClientIds();

	// If a block doesn't support splitting, let rich text paste inline.
	if (
		! hasMultiSelection() &&
		! hasBlockSupport(
			// The selected block has a name.
			getBlockName( selectedBlockClientIds[ 0 ] )!,
			'splitting',
			false
		) &&
		! __deprecatedOnSplit
	) {
		return;
	}

	// Pasting over an entirely selected block replaces it, the equivalent of
	// pasting into an empty block.
	if ( isEntireBlockSelected ) {
		return { blocks, replace: true };
	}

	const [ firstSelectedClientId ] = selectedBlockClientIds;
	const rootClientId = getBlockRootClientId( firstSelectedClientId );

	const newBlocks: Block[] = [];

	for ( const block of blocks ) {
		if ( canInsertBlockType( block.name, rootClientId ) ) {
			newBlocks.push( block );
		} else {
			// If a block cannot be inserted in a root block, try converting it
			// to that root block type and insert the inner blocks.
			// Example: paragraphs cannot be inserted into a list, so convert
			// the paragraphs to a list for list items.
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

	return { blocks: newBlocks, replace: false };
}

export default function useClipboardHandler() {
	const registry = useRegistry();
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
		__unstableSplitSelection,
		selectionChange,
	} = useDispatch( blockEditorStore );
	const notifyCopy = useNotifyCopy();

	return useRefEffect< HTMLElement >( ( node ) => {
		function handler( event: WritingFlowClipboardEvent ) {
			if ( event.defaultPrevented ) {
				// This was likely already handled in rich-text/use-paste-handler.js.
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

					// The selected blocks exist.
					setClipboardBlocks( event, blocks as Block[], registry );
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
			} else if ( event.type === 'paste' ) {
				const { mediaUpload } = getSettings();
				const isInternal =
					// Paste events carry clipboard data.
					event.clipboardData!.getData( 'rich-text' ) === 'true';
				if ( isInternal ) {
					return;
				}
				// Paste events carry readable clipboard data.
				const { plainText, html, files } = getPasteEventData(
					event as { clipboardData: DataTransfer }
				)!;

				if ( files.length && ! mediaUpload ) {
					event.preventDefault();
					return;
				}

				const pasted = getPastedBlocks( registry, {
					html,
					plainText,
					files,
					isEntireBlockSelected:
						! hasMultiSelection() &&
						isBlockEntirelySelected(
							( event.target as Element ).ownerDocument,
							selectedBlockClientIds[ 0 ]
						),
					__deprecatedOnSplit: event.__deprecatedOnSplit,
				} );
				if ( pasted ) {
					insertPastedBlocks( pasted );
					event.preventDefault();
				}
			}
		}

		function insertPastedBlocks( { blocks, replace }: PastedBlocks ) {
			if ( replace ) {
				replaceBlocks(
					getSelectedBlockClientIds(),
					blocks,
					blocks.length - 1,
					-1
				);
			} else {
				__unstableSplitSelection( blocks );
			}
		}

		// Text dropped from outside the editor is inserted the way it would
		// be pasted at the drop point. Rich text inserts the content inline
		// when it is not blocks.
		function onDrop( event: DragEvent ) {
			if ( event.defaultPrevented ) {
				return;
			}
			const point = getTextDropPoint( event );
			if ( ! point || ! node.contains( point.element ) ) {
				return;
			}
			const dataTransfer = event.dataTransfer!;
			if ( dataTransfer.getData( 'rich-text' ) === 'true' ) {
				return;
			}
			const data = getPasteEventData( { clipboardData: dataTransfer } );
			if ( ! data ) {
				return;
			}
			selectionChange(
				getBlockClientId( point.element )!,
				point.element.dataset.wpBlockAttributeKey,
				point.offset,
				point.offset
			);
			const pasted = getPastedBlocks( registry, {
				html: data.html,
				plainText: data.plainText,
				files: [],
				isEntireBlockSelected: false,
			} );
			if ( pasted ) {
				insertPastedBlocks( pasted );
				event.preventDefault();
			}
		}

		node.ownerDocument.addEventListener( 'copy', handler );
		node.ownerDocument.addEventListener( 'cut', handler );
		node.ownerDocument.addEventListener( 'paste', handler );
		// Capture, so blocks are inserted before the field inserts the drop
		// inline, as on paste, and before the block drop zone handles it.
		node.ownerDocument.addEventListener( 'drop', onDrop, true );

		return () => {
			node.ownerDocument.removeEventListener( 'copy', handler );
			node.ownerDocument.removeEventListener( 'cut', handler );
			node.ownerDocument.removeEventListener( 'paste', handler );
			node.ownerDocument.removeEventListener( 'drop', onDrop, true );
		};
	}, [] );
}
