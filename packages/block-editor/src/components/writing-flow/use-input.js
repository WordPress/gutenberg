/**
 * WordPress dependencies
 */
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

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';
import { getSelectionEditableElement } from '../../utils/dom';

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
	} = useSelect( blockEditorStore );
	const {
		replaceBlocks,
		__unstableSplitSelection,
		removeBlocks,
		__unstableDeleteSelection,
		__unstableExpandSelection,
		__unstableMarkAutomaticChange,
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
					if ( event.shiftKey || __unstableIsFullySelected() ) {
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

					if (
						! hasBlockSupport( blockName, 'splitting', false ) &&
						! event.__deprecatedOnSplit
					) {
						return;
					}

					// Ensure template is not locked.
					if (
						canInsertBlockType(
							getDefaultBlockName(),
							getBlockRootClientId( clientId )
						) ||
						canInsertBlockType(
							blockName,
							getBlockRootClientId( clientId )
						)
					) {
						__unstableSplitSelection();
						event.preventDefault();
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
