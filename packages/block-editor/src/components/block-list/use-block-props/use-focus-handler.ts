import { useSelect, useDispatch } from '@wordpress/data';
import {
	useRefEffect,
	privateApis as composePrivateApis,
} from '@wordpress/compose';
import { isInsideRootBlock } from '../../../utils/dom';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

/**
 * Selects the block if it receives focus.
 *
 * @param clientId Block client ID.
 */
export function useFocusHandler( clientId: string ) {
	const {
		isBlockSelected,
		isBlockMultiSelected,
		isAncestorMultiSelected,
		isMultiSelecting,
	} = useSelect( blockEditorStore );
	const { selectBlock, selectionChange } = useDispatch( blockEditorStore );

	return useRefEffect< HTMLElement >(
		( node ) => {
			/**
			 * Marks the block as selected when focused and not already
			 * selected. This specifically handles the case where block does not
			 * set focus on its own (via `setFocus`), typically if there is no
			 * focusable input in the block.
			 *
			 * @param event Focus event.
			 */
			function onFocus( event: FocusEvent ) {
				// Focus events target elements.
				const target = event.target as HTMLElement;
				// Check synchronously because a non-selected block might be
				// getting data through `useSelect` asynchronously.
				if ( isBlockSelected( clientId ) ) {
					// Potentially change selection away from rich text.
					if ( ! target.isContentEditable ) {
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
				// mouseup across browsers. A press inside a selected block
				// may start a drag of the selection; the click collapses it.
				if (
					isBlockMultiSelected( clientId ) ||
					isAncestorMultiSelected( clientId )
				) {
					return;
				}

				// If an inner block is focussed, that block is responsible for
				// setting the selected block.
				if ( ! isInsideRootBlock( node, target ) ) {
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
				if ( target.isContentEditable ) {
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
