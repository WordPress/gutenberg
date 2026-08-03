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
import { isInsideRootBlock, getBlockClientId } from '../../../utils/dom';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

/**
 * Selects the block if it receives focus.
 *
 * @param {string} clientId Block client ID.
 */
export function useFocusHandler( clientId ) {
	const { isBlockSelected, isBlockMultiSelected, isMultiSelecting } =
		useSelect( blockEditorStore );
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
				// Check synchronously because a non-selected block might be
				// getting data through `useSelect` asynchronously.
				if ( isBlockSelected( clientId ) ) {
					// Potentially change selection away from rich text.
					if ( ! event.target.isContentEditable ) {
						selectionChange( clientId );
					}
					return;
				}

				// Never select on the focus fired during a selection
				// gesture (a shift+click, marked by the selection observer
				// with startMultiSelect). The browser can focus the common
				// editable ancestor of the range (e.g. a group block), and
				// any selection re-render mid gesture destroys the native
				// selection being made. The observer builds the
				// multi-selection on mouseup.
				if ( isMultiSelecting() ) {
					return;
				}

				// A block that is part of the current multi-selection must
				// not collapse it. Focus can land on the clicked block after
				// the multi-selection was built: the focus event of a
				// shift+click is not ordered consistently against its
				// mouseup across browsers.
				if ( isBlockMultiSelected( clientId ) ) {
					return;
				}

				// If an inner block is focussed, that block is responsible for
				// setting the selected block.
				if ( ! isInsideRootBlock( node, event.target ) ) {
					return;
				}

				// For editable targets, select without initial caret
				// placement: the caret is inside the target. Placement would
				// move it, and would collapse a native selection in the
				// making, e.g. a shift+click extending the selection across
				// blocks while the wrapper is the editing host. The observer
				// builds the multi-selection from the anchor it recorded at
				// mousedown, so this dispatch overwriting the store anchor
				// is harmless.
				// A block wrapper can receive focus incidentally: a click on
				// an editable that is an inert part of the editing host (not
				// focusable itself) moves focus to the nearest focusable
				// ancestor. The caret, not the wrapper, says which block the
				// user is in: leave the selection alone when the selection
				// anchor sits within this block but belongs to a descendant
				// block.
				const { anchorNode } =
					node.ownerDocument.defaultView.getSelection();
				if (
					anchorNode &&
					node.contains( anchorNode ) &&
					getBlockClientId( anchorNode ) !== clientId
				) {
					return;
				}

				if ( event.target.isContentEditable ) {
					selectBlock( clientId, null );
					return;
				}

				selectBlock( clientId );
			}

			return subscribeDelegatedListener( node, 'focusin', onFocus );
		},
		[ isBlockSelected, selectBlock ]
	);
}
