/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { UP, DOWN, HOME, END } from '@wordpress/keycodes';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getCommonDepthClientIds } from './utils';

export default function useBlockSelection() {
	const { clearSelectedBlock, multiSelect, selectBlock } =
		useDispatch( blockEditorStore );
	const {
		getBlockName,
		getBlockParents,
		getBlockSelectionStart,
		getBlockSelectionEnd,
		getSelectedBlockClientIds,
		hasMultiSelection,
		hasSelectedBlock,
	} = useSelect( blockEditorStore );

	const { getBlockType } = useSelect( blocksStore );

	const updateBlockSelection = useCallback(
		async ( event, clientId, destinationClientId ) => {
			if ( ! event?.shiftKey ) {
				selectBlock( clientId );
				return;
			}

			// To handle multiple block selection via the `SHIFT` key, prevent
			// the browser default behavior of opening the link in a new window.
			event.preventDefault();

			const isKeyPress =
				event.type === 'keydown' &&
				( event.keyCode === UP ||
					event.keyCode === DOWN ||
					event.keyCode === HOME ||
					event.keyCode === END );

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
			await multiSelect( start, end, null );

			// Announce deselected block, or number of deselected blocks if
			// the total number of blocks deselected is greater than one.
			const updatedSelectedBlocks = getSelectedBlockClientIds();

			// If the selection is greater than 1 and the Home or End keys
			// were used to generate the selection, then skip announcing the
			// deselected blocks.
			if (
				( event.keyCode === HOME || event.keyCode === END ) &&
				updatedSelectedBlocks.length > 1
			) {
				return;
			}

			const selectionDiff = selectedBlocks.filter(
				( blockId ) => ! updatedSelectedBlocks.includes( blockId )
			);

			let label;
			if ( selectionDiff.length === 1 ) {
				const title = getBlockType(
					getBlockName( selectionDiff[ 0 ] )
				)?.title;
				if ( title ) {
					label = sprintf(
						/* translators: %s: block name */
						__( '%s deselected.' ),
						title
					);
				}
			} else if ( selectionDiff.length > 1 ) {
				label = sprintf(
					/* translators: %s: number of deselected blocks */
					__( '%s blocks deselected.' ),
					selectionDiff.length
				);
			}

			if ( label ) {
				speak( label );
			}
		},
		[
			clearSelectedBlock,
			getBlockName,
			getBlockType,
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
