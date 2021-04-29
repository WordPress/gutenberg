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
				if ( isNavigationMode() ) {
					// Prevent focus from moving to the block.
					event.preventDefault();

					if ( isBlockSelected( clientId ) ) {
						setNavigationMode( false );
					} else {
						selectBlock( clientId );
					}
				}
			}

			node.addEventListener( 'mousedown', onMouseDown );

			return () => {
				node.addEventListener( 'mousedown', onMouseDown );
			};
		},
		[ clientId, isNavigationMode, isBlockSelected, setNavigationMode ]
	);
}
