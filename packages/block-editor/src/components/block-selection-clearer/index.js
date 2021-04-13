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
	const hasSelection = useSelect( ( select ) => {
		const { hasSelectedBlock, hasMultiSelection } = select(
			blockEditorStore
		);

		return hasSelectedBlock() || hasMultiSelection();
	} );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	return useRefEffect(
		( node ) => {
			if ( ! hasSelection ) {
				return;
			}

			function onMouseDown( event ) {
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
		[ hasSelection, clearSelectedBlock ]
	);
}

export default function BlockSelectionClearer( props ) {
	return <div ref={ useBlockSelectionClearer() } { ...props } />;
}
