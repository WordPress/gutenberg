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

				const clientId = getBlockClientId( event.target );

				if ( event.shiftKey ) {
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
						const startPath = [
							...startParents,
							blockSelectionStart,
						];
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
							event.preventDefault();
						}
					}
				} else if ( hasMultiSelection() ) {
					// Allow user to escape out of a multi-selection to a
					// singular selection of a block via click. This is handled
					// here since focus handling excludes blocks when there is
					// multiselection, as focus can be incurred by starting a
					// multiselection (focus moved to first block's multi-
					// controls).
					selectBlock( clientId );
				}
			}

			node.addEventListener( 'mousedown', onMouseDown );

			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
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
