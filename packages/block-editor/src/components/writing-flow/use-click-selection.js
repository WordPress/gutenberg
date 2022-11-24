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
import { findDepth } from './use-selection-observer';

export default function useClickSelection() {
	const { selectBlock, multiSelect } = useDispatch( blockEditorStore );
	const {
		isSelectionEnabled,
		getBlockSelectionStart,
		hasMultiSelection,
		getBlockParents,
	} = useSelect( blockEditorStore );
	return useRefEffect(
		( node ) => {
			function onMouseDown( event ) {
				// The main button.
				// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
				if ( ! isSelectionEnabled() || event.button !== 0 ) {
					return;
				}

				const clickedClientId = getBlockClientId( event.target );

				if ( event.shiftKey ) {
					const startClientId = getBlockSelectionStart();
					const { ownerDocument } = event.target;
					const { defaultView } = ownerDocument;

					if (
						startClientId &&
						! defaultView.getSelection().rangeCount
					) {
						const startPath = [
							...getBlockParents( startClientId ),
							startClientId,
						];
						const endPath = [
							...getBlockParents( clickedClientId ),
							clickedClientId,
						];
						const depth = findDepth( startPath, endPath );

						multiSelect( startPath[ depth ], endPath[ depth ] );
						event.preventDefault();
					}
				} else if ( hasMultiSelection() ) {
					// Allow user to escape out of a multi-selection to a
					// singular selection of a block via click. This is handled
					// here since focus handling excludes blocks when there is
					// multiselection, as focus can be incurred by starting a
					// multiselection (focus moved to first block's multi-
					// controls).
					selectBlock( clickedClientId );
				}
			}

			node.addEventListener( 'mousedown', onMouseDown );

			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
			};
		},
		[
			selectBlock,
			isSelectionEnabled,
			getBlockSelectionStart,
			hasMultiSelection,
		]
	);
}
