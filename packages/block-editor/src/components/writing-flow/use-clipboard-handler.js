/**
 * WordPress dependencies
 */
import {
	serialize,
	pasteHandler,
	createBlock,
	findTransform,
	getBlockTransforms,
	hasBlockSupport,
} from '@wordpress/blocks';
import {
	documentHasSelection,
	documentHasUncollapsedSelection,
	__unstableStripHTML as stripHTML,
} from '@wordpress/dom';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getPasteEventData } from '../../utils/pasting';
import { store as blockEditorStore } from '../../store';
import { useNotifyCopy } from '../../utils/use-notify-copy';

export default function useClipboardHandler() {
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

					const wrapperBlockName = event.clipboardData.getData(
						'__unstableWrapperBlockName'
					);

					if ( wrapperBlockName ) {
						blocks = createBlock(
							wrapperBlockName,
							JSON.parse(
								event.clipboardData.getData(
									'__unstableWrapperBlockAttributes'
								)
							),
							blocks
						);
					}

					const serialized = serialize( blocks );

					event.clipboardData.setData(
						'text/plain',
						toPlainText( serialized )
					);
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
				const firstSelectedBlockName = getBlockName(
					firstSelectedClientId
				);

				const [ transform ] = getBlockTransforms(
					'from',
					firstSelectedBlockName
				).filter( ( { type } ) => type === 'paste' );

				if ( transform ) {
					blocks = transform.transform( blocks );
				}

				const rootClientId = getBlockRootClientId(
					firstSelectedClientId
				);

				if (
					! blocks.every( ( block ) =>
						canInsertBlockType( block.name, rootClientId )
					)
				) {
					return;
				}

				__unstableSplitSelection( blocks );
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

/**
 * Given a string of HTML representing serialized blocks, returns the plain
 * text extracted after stripping the HTML of any tags and fixing line breaks.
 *
 * @param {string} html Serialized blocks.
 * @return {string} The plain-text content with any html removed.
 */
function toPlainText( html ) {
	// Manually handle BR tags as line breaks prior to `stripHTML` call
	html = html.replace( /<br>/g, '\n' );

	const plainText = stripHTML( html ).trim();

	// Merge any consecutive line breaks
	return plainText.replace( /\n\n+/g, '\n\n' );
}
