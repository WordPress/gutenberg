import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
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

			let isPressOnNode = false;

			function onMouseDown( event ) {
				isPressOnNode = event.target === node;
			}

			// Clear on click rather than on mouse down: a press on the
			// element may start a native selection that ends in a block,
			// which must be kept.
			function onClick( event ) {
				if ( ! hasSelectedBlock() && ! hasMultiSelection() ) {
					return;
				}

				// Only handle clicks on the element, not the children. A drag
				// between children also ends with a click on the element.
				if ( event.target !== node || ! isPressOnNode ) {
					return;
				}

				const { ownerDocument } = node;
				if ( ! ownerDocument.defaultView.getSelection().isCollapsed ) {
					return;
				}

				clearSelectedBlock();
			}

			node.addEventListener( 'mousedown', onMouseDown );
			node.addEventListener( 'click', onClick );

			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
				node.removeEventListener( 'click', onClick );
			};
		},
		[ hasSelectedBlock, hasMultiSelection, clearSelectedBlock, isEnabled ]
	);
}

export default function BlockSelectionClearer( props ) {
	return <div ref={ useBlockSelectionClearer() } { ...props } />;
}
