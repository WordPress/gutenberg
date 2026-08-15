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
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';
import { getBlockClientId, getSelectionEditableElement } from '../../utils/dom';

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

	return useRefEffect( ( node ) => {
		function onBeforeInput( event ) {
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

			const selection = node.ownerDocument.defaultView.getSelection();

			if ( ! getSelectionEditableElement( selection, node ) ) {
				event.preventDefault();
			}
		}

		function onKeyDown( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			if ( ! hasMultiSelection() ) {
				if ( event.keyCode === ENTER ) {
					if ( event.shiftKey ) {
						return;
					}

					const clientId = getSelectedBlockClientId();
					const blockName = getBlockName( clientId );
					const selectionStart = getSelectionStart();
					const selectionEnd = getSelectionEnd();

					if (
						selectionStart.attributeKey ===
						selectionEnd.attributeKey
					) {
						const selectedAttributeValue =
							getBlockAttributes( clientId )[
								selectionStart.attributeKey
							];
						const transforms = getBlockTransforms( 'from' ).filter(
							( { type } ) => type === 'enter'
						);
						const transformation = findTransform(
							transforms,
							( item ) => {
								return item.regExp.test(
									selectedAttributeValue
								);
							}
						);

						if ( transformation ) {
							replaceBlocks(
								clientId,
								transformation.transform( {
									content: selectedAttributeValue,
								} )
							);
							__unstableMarkAutomaticChange();
							return;
						}
					}

					const rootClientId = getBlockRootClientId( clientId );
					const { activeElement } = event.target.ownerDocument;

					// Ensure template is not locked.
					if (
						! __unstableIsFullySelected() &&
						( canInsertBlockType(
							getDefaultBlockName(),
							rootClientId
						) ||
							canInsertBlockType( blockName, rootClientId ) ) &&
						( hasBlockSupport( blockName, 'splitting', false ) ||
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
										createBlock(
											name,
											defaultBlock?.attributes
										),
										0,
										clientId
									);
									return;
								}
							}

							function getNextClientId( id ) {
								let nextClientId = null;

								while (
									typeof id === 'string' &&
									! ( nextClientId =
										getNextBlockClientId( id ) )
								) {
									id = getBlockRootClientId( id );
								}

								return nextClientId;
							}

							let nextClientId =
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
								selectBlock( nextClientId, true );
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
						createBlock( getDefaultBlockName() )
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
					node.ownerDocument.defaultView
						.getSelection()
						.removeAllRanges();
				}
			}
		}

		function onCompositionStart( event ) {
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
				node.ownerDocument.defaultView.getSelection().removeAllRanges();
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
