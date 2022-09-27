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
 * @param {boolean} isDisabled Disable the block selection clearer.
 * @return {import('react').RefCallback} Ref callback.
 */
export function useBlockSelectionClearer( isDisabled ) {
	const { hasSelectedBlock, hasMultiSelection } =
		useSelect( blockEditorStore );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	return useRefEffect(
		( node ) => {
			if ( isDisabled ) {
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

				clearSelectedBlock();
			}

			node.addEventListener( 'mousedown', onMouseDown );

			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
			};
		},
		[ hasSelectedBlock, hasMultiSelection, clearSelectedBlock, isDisabled ]
	);
}

export default function BlockSelectionClearer( props ) {
	return <div ref={ useBlockSelectionClearer() } { ...props } />;
}
