/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Pass the returned ref callback to an element that should clear block
 * selection. Selection will only be cleared if the element is clicked directly,
 * not if a child element is clicked.
 *
 * @return {React.RefCallback} Ref callback.
 */
export function useBlockSelectionClearer() {
	const { getSettings, hasSelectedBlock, hasMultiSelection } =
		useSelect( blockEditorStore );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const { clearBlockSelection: isEnabled } = getSettings();

	return useRefEffect(
		( node ) => {
			if ( ! isEnabled ) {
				return;
			}

			function onMouseDown( event ) {
				if ( ! hasSelectedBlock() && ! hasMultiSelection() ) {
					return;
				}

				// Only handle clicks on the element, not the children.
				if ( event.target !== node ) {
					return;
				}

				// The second and third mousedown of a double or triple click
				// are part of a text selection gesture (e.g. a triple click
				// on the canvas padding selects the paragraph next to it),
				// not a click away from the blocks. Clearing the selection
				// mid-gesture also re-renders the selected block's editable,
				// and the mutation makes the browser abandon the native
				// selection expansion.
				if ( event.detail > 1 ) {
					return;
				}

				clearSelectedBlock();
			}

			node.addEventListener( 'mousedown', onMouseDown );

			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
			};
		},
		[ hasSelectedBlock, hasMultiSelection, clearSelectedBlock, isEnabled ]
	);
}

export default function BlockSelectionClearer( props ) {
	return <div ref={ useBlockSelectionClearer() } { ...props } />;
}
