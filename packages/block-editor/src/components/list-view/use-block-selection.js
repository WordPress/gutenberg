/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function useBlockSelection() {
	const { clearSelectedBlock, multiSelect, selectBlock } = useDispatch(
		blockEditorStore
	);
	const {
		getBlockParents,
		getBlockSelectionStart,
		hasMultiSelection,
		hasSelectedBlock,
	} = useSelect( blockEditorStore );

	const updateBlockSelection = useCallback(
		async ( clientId, event ) => {
			if ( ! event.shiftKey || event.type === 'keydown' ) {
				// When this function is called from a 'keydown' event, select
				// the block as if it were individually clicked. This allows
				// the editor canvas to be responsible for the shift + up/down
				// multiple block selection behaviour.
				await clearSelectedBlock();
				selectBlock( clientId, -1 );
			} else if ( event.shiftKey ) {
				// To handle multiple block selection via the `SHIFT` key, prevent
				// the browser default behavior of opening the link in a new window.
				event.preventDefault();

				// Select a single block if no block is selected yet.
				if ( ! hasSelectedBlock() && ! hasMultiSelection() ) {
					selectBlock( clientId, -1 );
					return;
				}

				const blockSelectionStart = getBlockSelectionStart();

				// By checking `blockSelectionStart` to be set, we handle the
				// case where we select a single block. We also have to check
				// the selectionEnd (clientId) not to be included in the
				// `blockSelectionStart`'s parents because the click event is
				// propagated.
				const startParents = getBlockParents( blockSelectionStart );

				if (
					blockSelectionStart &&
					blockSelectionStart !== clientId &&
					! startParents?.includes( clientId )
				) {
					const startPath = [ ...startParents, blockSelectionStart ];
					const endPath = [
						...getBlockParents( clientId ),
						clientId,
					];
					const depth =
						Math.min( startPath.length, endPath.length ) - 1;
					const start = startPath[ depth ];
					const end = endPath[ depth ];

					// Handle the case of having selected a parent block and
					// then shift+click on a child.
					if ( start !== end ) {
						multiSelect( start, end );
					}
				}
			}
		},
		[
			clearSelectedBlock,
			getBlockParents,
			getBlockSelectionStart,
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
