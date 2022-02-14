/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { UP, DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getCommonDepthClientIds } from './utils';

export default function useBlockSelection() {
	const { clearSelectedBlock, multiSelect, selectBlock } = useDispatch(
		blockEditorStore
	);
	const {
		getBlockParents,
		getBlockSelectionStart,
		getBlockSelectionEnd,
		getSelectedBlockClientIds,
		hasMultiSelection,
		hasSelectedBlock,
	} = useSelect( blockEditorStore );

	const updateBlockSelection = useCallback(
		async ( event, clientId, destinationClientId ) => {
			if ( ! event.shiftKey ) {
				await clearSelectedBlock();
				selectBlock( clientId );
				return;
			}

			// To handle multiple block selection via the `SHIFT` key, prevent
			// the browser default behavior of opening the link in a new window.
			event.preventDefault();

			const isKeyPress =
				event.type === 'keydown' &&
				( event.keyCode === UP || event.keyCode === DOWN );

			// Handle clicking on a block when no blocks are selected, and return early.
			if (
				! isKeyPress &&
				! hasSelectedBlock() &&
				! hasMultiSelection()
			) {
				selectBlock( clientId, null );
				return;
			}

			const selectedBlocks = getSelectedBlockClientIds();
			const clientIdWithParents = [
				...getBlockParents( clientId ),
				clientId,
			];

			if (
				isKeyPress &&
				! selectedBlocks.some( ( blockId ) =>
					clientIdWithParents.includes( blockId )
				)
			) {
				// Ensure that shift-selecting blocks via the keyboard only
				// expands the current selection if focusing over already
				// selected blocks. Otherwise, clear the selection so that
				// a user can create a new selection entirely by keyboard.
				await clearSelectedBlock();
			}

			let startTarget = getBlockSelectionStart();
			let endTarget = clientId;

			// Handle keyboard behavior for selecting multiple blocks.
			if ( isKeyPress ) {
				if ( ! hasSelectedBlock() && ! hasMultiSelection() ) {
					// Set the starting point of the selection to the currently
					// focused block, if there are no blocks currently selected.
					// This ensures that as the selection is expanded or contracted,
					// the starting point of the selection is anchored to that block.
					startTarget = clientId;
				}
				if ( destinationClientId ) {
					// If the user presses UP or DOWN, we want to ensure that the block they're
					// moving to is the target for selection, and not the currently focused one.
					endTarget = destinationClientId;
				}
			}

			const startParents = getBlockParents( startTarget );
			const endParents = getBlockParents( endTarget );

			const { start, end } = getCommonDepthClientIds(
				startTarget,
				endTarget,
				startParents,
				endParents
			);
			multiSelect( start, end, null );
		},
		[
			clearSelectedBlock,
			getBlockParents,
			getBlockSelectionStart,
			getBlockSelectionEnd,
			getSelectedBlockClientIds,
			hasMultiSelection,
			hasSelectedBlock,
			multiSelect,
			selectBlock,
		]
	);

	return {
		updateBlockSelection,
	};
}
