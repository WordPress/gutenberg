/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Handles input for selections across blocks.
 */
export default function useInput() {
	const {
		__unstableIsFullySelected,
		getSelectedBlockClientIds,
		__unstableIsSelectionMergeable,
		hasMultiSelection,
	} = useSelect( blockEditorStore );
	const {
		replaceBlocks,
		__unstableSplitSelection,
		removeBlocks,
		__unstableDeleteSelection,
		__unstableExpandSelection,
	} = useDispatch( blockEditorStore );

	return useRefEffect( ( node ) => {
		function onBeforeInput( event ) {
			// If writing flow is editable, NEVER allow the browser to alter the
			// DOM. This will cause React errors (and the DOM should only be
			// altered in a controlled fashion).
			if ( node.contentEditable === 'true' ) {
				event.preventDefault();
			}
		}

		function onKeyDown( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			if ( ! hasMultiSelection() ) {
				return;
			}

			if ( event.keyCode === ENTER ) {
				node.contentEditable = false;
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
				node.contentEditable = false;
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
				node.contentEditable = false;
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

			node.contentEditable = false;

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
