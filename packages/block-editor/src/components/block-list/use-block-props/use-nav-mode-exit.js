/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

/**
 * Allows navigation mode to be exited by clicking in the selected block.
 *
 * @param {string} clientId Block client ID.
 */
export function useNavModeExit( clientId ) {
	const { isNavigationMode, isBlockSelected } = useSelect( blockEditorStore );
	const { setNavigationMode, selectBlock } = useDispatch( blockEditorStore );
	return useRefEffect(
		( node ) => {
			function onMouseDown( event ) {
				// Don't select a block if it's already handled by a child
				// block.
				event.stopPropagation();

				if ( isNavigationMode() && ! event.defaultPrevented ) {
					if ( ! isBlockSelected( clientId ) ) {
						// Prevent focus from moving to the block.
						event.preventDefault();
						selectBlock( clientId );
					}
				}
			}

			node.addEventListener( 'mousedown', onMouseDown );

			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
			};
		},
		[ clientId, isNavigationMode, isBlockSelected, setNavigationMode ]
	);
}
