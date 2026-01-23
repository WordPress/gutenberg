/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { isInsideRootBlock } from '../../../utils/dom';
import { store as blockEditorStore } from '../../../store';

/**
 * Selects the block if it receives focus.
 *
 * @param {string} clientId Block client ID.
 */
export function useFocusHandler( clientId ) {
	const { isBlockSelected } = useSelect( blockEditorStore );
	const { selectBlock, selectionChange } = useDispatch( blockEditorStore );

	return useRefEffect(
		( node ) => {
			/**
			 * Marks the block as selected when focused and not already
			 * selected. This specifically handles the case where block does not
			 * set focus on its own (via `setFocus`), typically if there is no
			 * focusable input in the block.
			 *
			 * @param {FocusEvent} event Focus event.
			 */
			function onFocus( event ) {
				// When the whole editor is editable, let writing flow handle
				// selection.
				if (
					node.parentElement.closest( '[contenteditable="true"]' )
				) {
					return;
				}

				// Check synchronously because a non-selected block might be
				// getting data through `useSelect` asynchronously.
				if ( isBlockSelected( clientId ) ) {
					// Potentially change selection away from rich text.
					if ( ! event.target.isContentEditable ) {
						selectionChange( clientId );
					}
					return;
				}

				// If an inner block is focussed, that block is responsible for
				// setting the selected block.
				if ( ! isInsideRootBlock( node, event.target ) ) {
					return;
				}

				selectBlock( clientId );
			}

			node.addEventListener( 'focusin', onFocus );

			return () => {
				node.removeEventListener( 'focusin', onFocus );
			};
		},
		[ isBlockSelected, selectBlock ]
	);
}
