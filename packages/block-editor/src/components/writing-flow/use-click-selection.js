/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getBlockClientId } from '../../utils/dom';

export default function useClickSelection() {
	const { multiSelect, selectBlock } = useDispatch( blockEditorStore );
	const {
		isSelectionEnabled,
		getBlockParents,
		getBlockSelectionStart,
		hasMultiSelection,
	} = useSelect( blockEditorStore );
	return useRefEffect(
		( node ) => {
			function onMouseDown( event ) {
				// The main button.
				// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
				if ( ! isSelectionEnabled() || event.button !== 0 ) {
					return;
				}

				if ( event.shiftKey ) {
					node.contentEditable = true;
					// Firefox doesn't automatically move focus.
					node.focus();
				} else if ( hasMultiSelection() ) {
					// Allow user to escape out of a multi-selection to a
					// singular selection of a block via click. This is handled
					// here since focus handling excludes blocks when there is
					// multiselection, as focus can be incurred by starting a
					// multiselection (focus moved to first block's multi-
					// controls).
					selectBlock( getBlockClientId( event.target ) );
				}
			}

			function onMouseUp() {
				const { ownerDocument } = node;
				const { defaultView } = ownerDocument;
				const selection = defaultView.getSelection();

				if (
					! selection.rangeCount ||
					selection.isCollapsed ||
					getBlockClientId( selection.anchorNode ) ===
						getBlockClientId( selection.focusNode )
				) {
					node.contentEditable = false;
				}
			}

			node.addEventListener( 'mousedown', onMouseDown );
			node.addEventListener( 'mouseup', onMouseUp );

			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
				node.removeEventListener( 'mouseup', onMouseUp );
			};
		},
		[
			multiSelect,
			selectBlock,
			isSelectionEnabled,
			getBlockParents,
			getBlockSelectionStart,
			hasMultiSelection,
		]
	);
}
