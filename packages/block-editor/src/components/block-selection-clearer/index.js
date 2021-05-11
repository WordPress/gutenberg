/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export function useBlockSelectionClearer( onlySelfClicks = false ) {
	const { hasSelectedBlock, hasMultiSelection } = useSelect(
		blockEditorStore
	);
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	return useRefEffect(
		( node ) => {
			function onMouseDown( event ) {
				if ( ! hasSelectedBlock() && ! hasMultiSelection() ) {
					return;
				}

				// Only handle clicks on the canvas, not the content.
				if (
					event.target.closest( '.wp-block' ) ||
					( onlySelfClicks && event.target !== node )
				) {
					return;
				}

				clearSelectedBlock();
			}

			node.addEventListener( 'mousedown', onMouseDown );

			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
			};
		},
		[ hasSelectedBlock, hasMultiSelection, clearSelectedBlock ]
	);
}

export default function BlockSelectionClearer( props ) {
	return <div ref={ useBlockSelectionClearer() } { ...props } />;
}
