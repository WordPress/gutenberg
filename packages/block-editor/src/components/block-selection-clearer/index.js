/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export function useBlockSelectionClearer( ref ) {
	const hasSelection = useSelect( ( select ) => {
		const { hasSelectedBlock, hasMultiSelection } = select(
			blockEditorStore
		);

		return hasSelectedBlock() || hasMultiSelection();
	} );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	useEffect( () => {
		if ( ! hasSelection ) {
			return;
		}

		function onMouseDown( event ) {
			// Only handle clicks on the canvas, not the content.
			if ( event.target.closest( '.wp-block' ) ) {
				return;
			}

			clearSelectedBlock();
		}

		ref.current.addEventListener( 'mousedown', onMouseDown );

		return () => {
			ref.current.removeEventListener( 'mousedown', onMouseDown );
		};
	}, [ hasSelection, clearSelectedBlock ] );
}

export default function BlockSelectionClearer( props ) {
	const ref = useRef();
	useBlockSelectionClearer( ref );
	return <div ref={ ref } { ...props } />;
}
