import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import {
	createBlock,
	getDefaultBlockName,
	hasBlockSupport,
	getBlockTransforms,
	findTransform,
} from '@wordpress/blocks';
import type { BlockEnterTransform } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';
import { getBlockClientId, getSelectionEditableElement } from '../../utils/dom';
import type { InitialPosition } from '../../store/types';
import type { WritingFlowKeyEvent } from './types';

/**
 * Handles input for selections across blocks.
 */
export default function useInput() {
	const {
		__unstableIsFullySelected,
		getSelectedBlockClientIds,
		getSelectedBlockClientId,
		__unstableIsSelectionMergeable,
		hasMultiSelection,
		getBlockName,
		canInsertBlockType,
		getBlockRootClientId,
		getSelectionStart,
		getSelectionEnd,
		getBlockAttributes,
		getNextBlockClientId,
		getBlockOrder,
		getBlockEditingMode,
		getBlockListSettings,
	} = useSelect( blockEditorStore );
	const {
		replaceBlocks,
		__unstableSplitSelection,
		removeBlocks,
		__unstableDeleteSelection,
		__unstableExpandSelection,
		__unstableMarkAutomaticChange,
		insertAfterBlock,
		insertBlock,
		selectBlock,
	} = useDispatch( blockEditorStore );

	return useRefEffect< HTMLElement >( ( node ) => {
		function onBeforeInput( event: InputEvent ) {
			// Enter in an editable is handled here instead of on keydown:
			// moving focus while the keydown is still being handled leaves
			// the iOS keyboard's auto-capitalization stale.
			if (
				event.inputType === 'insertParagraph' &&
				! event.defaultPrevented &&
				! hasMultiSelection()
			) {
				// Enter is handled like its key down.
				onKeyDown( event as unknown as WritingFlowKeyEvent );
				if ( event.defaultPrevented ) {
					return;
				}
			}

			// If writing flow is editable, never allow the browser to alter
			// the DOM outside of an editable element within a block. This
			// will cause React errors (and the DOM should only be altered in
			// a controlled fashion). The wrapper can be contentEditable with
			// a single selection when the selected block supports
			// `editableRoot`; in that case edits within the block's editable
			// element are handled by its rich text instance.
			if ( node.contentEditable !== 'true' ) {
				return;
			}

			if ( hasMultiSelection() ) {
				event.preventDefault();
				return;
			}

			// A mounted element's window has a selection.
			const selection = node.ownerDocument.defaultView!.getSelection()!;

			if ( ! getSelectionEditableElement( selection, node ) ) {
				event.preventDefault();
			}
		}

		function onKeyDown( event: WritingFlowKeyEvent ) {
			if ( event.defaultPrevented ) {
				return;
			}

			if ( ! hasMultiSelection() ) {
				if (
					event.keyCode === ENTER ||
					event.inputType === 'insertParagraph'
				) {
					if (
						event.shiftKey ||
						// Editables are handled on beforeinput.
						( event.type === 'keydown' &&
							// Key events reach the listener from elements.
							(
								( event.target as Element ).ownerDocument
									.activeElement as HTMLElement
							 ).isContentEditable )
					) {
						return;
					}

					const clientId = getSelectedBlockClientId();
					if ( ! clientId ) {
						return;
					}

					const blockName = getBlockName( clientId );
					const selectionStart = getSelectionStart();
					const selectionEnd = getSelectionEnd();

					if (
						selectionStart.attributeKey ===
						selectionEnd.attributeKey
					) {
						// The selection is within an attribute of the selected block.
						const selectedAttributeValue = getBlockAttributes(
							clientId
						)![ selectionStart.attributeKey! ] as string;
						const transforms = getBlockTransforms( 'from' ).filter(
							( { type } ) => type === 'enter'
						);
						const transformation = findTransform(
							transforms,
							( item ) => {
								// The filter above keeps enter transforms.
								return (
									item as BlockEnterTransform
								 ).regExp.test( selectedAttributeValue );
							}
						);

						if ( transformation ) {
							replaceBlocks(
								clientId,
								// Enter transforms transform.
								( transformation as BlockEnterTransform )
									.transform!( {
									content: selectedAttributeValue,
								} )
							);
							__unstableMarkAutomaticChange();
							return;
						}
					}

					const rootClientId = getBlockRootClientId( clientId );
					const activeElement = ( event.target as Element )
						.ownerDocument.activeElement as HTMLElement;

					// Ensure template is not locked.
					if (
						! __unstableIsFullySelected() &&
						( canInsertBlockType(
							getDefaultBlockName(),
							rootClientId
						) ||
							canInsertBlockType( blockName, rootClientId ) ) &&
						// The selected block has a name.
						( hasBlockSupport( blockName!, 'splitting', false ) ||
							event.__deprecatedOnSplit )
					) {
						event.preventDefault();
						__unstableSplitSelection();
					} else if (
						// Handle Enter only on the block wrapper itself or
						// an editable element within the block, which may be
						// nested within the wrapper (e.g. Site Title). Other
						// focusable elements (an embed's URL field, an
						// appender button) keep their native Enter behavior.
						( activeElement.getAttribute( 'data-block' ) ===
							clientId ||
							activeElement.isContentEditable ) &&
						getBlockClientId( activeElement ) === clientId
					) {
						// The default block depends on context: containers
						// such as the gallery define their own default
						// block, which is what insertAfterBlock inserts.
						const { defaultBlock: directInsertBlock } =
							( rootClientId &&
								getBlockListSettings( rootClientId ) ) ||
							{};

						if (
							canInsertBlockType(
								directInsertBlock?.name ??
									getDefaultBlockName(),
								rootClientId
							)
						) {
							event.preventDefault();
							insertAfterBlock( clientId );
						} else {
							// Descend into an empty container by inserting
							// its default block, the same block an appender
							// or ghost would insert.
							if ( ! getBlockOrder( clientId ).length ) {
								const { defaultBlock } =
									getBlockListSettings( clientId ) ?? {};
								const name =
									defaultBlock?.name ?? getDefaultBlockName();

								if ( canInsertBlockType( name, clientId ) ) {
									event.preventDefault();
									insertBlock(
										// Blocks are registered, so there is a default block.
										createBlock(
											name!,
											defaultBlock?.attributes
										),
										0,
										clientId
									);
									return;
								}
							}

							function getNextClientId( id: string | null ) {
								let nextClientId: string | null = null;

								while (
									typeof id === 'string' &&
									! ( nextClientId =
										getNextBlockClientId( id ) )
								) {
									id = getBlockRootClientId( id );
								}

								return nextClientId;
							}

							let nextClientId: string | null =
								getBlockOrder( clientId )[ 0 ] ??
								getNextClientId( clientId );

							while (
								nextClientId &&
								getBlockEditingMode( nextClientId ) ===
									'disabled'
							) {
								nextClientId = getNextClientId( nextClientId );
							}

							if ( nextClientId ) {
								event.preventDefault();
								// An initial position of `true` is an
								// internal sentinel: it focuses the block
								// wrapper instead of a text field within
								// it. See useFocusFirstElement.
								selectBlock(
									nextClientId,
									true as unknown as InitialPosition
								);
							}
						}
					}
				}
				return;
			}

			if ( event.keyCode === ENTER ) {
				setContentEditableWrapper( node, false );
				event.preventDefault();
				if ( __unstableIsFullySelected() ) {
					replaceBlocks(
						getSelectedBlockClientIds(),
						// Blocks are registered, so there is a default block.
						createBlock( getDefaultBlockName()! )
					);
				} else {
					__unstableSplitSelection();
				}
			} else if (
				event.keyCode === BACKSPACE ||
				event.keyCode === DELETE
			) {
				setContentEditableWrapper( node, false );
				event.preventDefault();
				if ( __unstableIsFullySelected() ) {
					removeBlocks( getSelectedBlockClientIds() );
				} else if ( __unstableIsSelectionMergeable() ) {
					__unstableDeleteSelection( event.keyCode === DELETE );
				} else {
					__unstableExpandSelection();
				}
			} else if (
				// If key.length is longer than 1, it's a control key that doesn't
				// input anything.
				event.key.length === 1 &&
				! ( event.metaKey || event.ctrlKey )
			) {
				setContentEditableWrapper( node, false );
				if ( __unstableIsSelectionMergeable() ) {
					__unstableDeleteSelection( event.keyCode === DELETE );
				} else {
					event.preventDefault();
					// Safari does not stop default behaviour with either
					// event.preventDefault() or node.contentEditable = false, so
					// remove the selection to stop browser manipulation.
					node.ownerDocument
						.defaultView!.getSelection()!
						.removeAllRanges();
				}
			}
		}

		function onCompositionStart( event: CompositionEvent ) {
			if ( ! hasMultiSelection() ) {
				return;
			}

			setContentEditableWrapper( node, false );

			if ( __unstableIsSelectionMergeable() ) {
				__unstableDeleteSelection();
			} else {
				event.preventDefault();
				// Safari does not stop default behaviour with either
				// event.preventDefault() or node.contentEditable = false, so
				// remove the selection to stop browser manipulation.
				node.ownerDocument
					.defaultView!.getSelection()!
					.removeAllRanges();
			}
		}

		node.addEventListener( 'beforeinput', onBeforeInput );
		node.addEventListener( 'keydown', onKeyDown );
		node.addEventListener( 'compositionstart', onCompositionStart );
		return () => {
			node.removeEventListener( 'beforeinput', onBeforeInput );
			node.removeEventListener( 'keydown', onKeyDown );
			node.removeEventListener( 'compositionstart', onCompositionStart );
		};
	}, [] );
}
