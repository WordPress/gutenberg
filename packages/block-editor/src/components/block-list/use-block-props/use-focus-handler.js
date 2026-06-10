/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useRefEffect,
	privateApis as composePrivateApis,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { isInsideRootBlock } from '../../../utils/dom';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

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
			let isShiftMouseDown = false;

			function onMouseDown( event ) {
				isShiftMouseDown = event.shiftKey;
			}

			function onMouseUp() {
				isShiftMouseDown = false;
			}

			/**
			 * Marks the block as selected when focused and not already
			 * selected. This specifically handles the case where block does not
			 * set focus on its own (via `setFocus`), typically if there is no
			 * focusable input in the block.
			 *
			 * @param {FocusEvent} event Focus event.
			 */
			function onFocus( event ) {
				// When the whole editor is editable and a shift+click gesture
				// is in progress, let writing flow handle (multi) selection.
				// Without the shift key, focus within an editable wrapper
				// still expresses the intent to select the block.
				if (
					isShiftMouseDown &&
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

			const unsubscribeFocus = subscribeDelegatedListener(
				node,
				'focusin',
				onFocus
			);
			const unsubscribeMouseDown = subscribeDelegatedListener(
				node,
				'mousedown',
				onMouseDown
			);
			const unsubscribeMouseUp = subscribeDelegatedListener(
				node.ownerDocument,
				'mouseup',
				onMouseUp
			);

			return () => {
				unsubscribeFocus();
				unsubscribeMouseDown();
				unsubscribeMouseUp();
			};
		},
		[ isBlockSelected, selectBlock ]
	);
}
