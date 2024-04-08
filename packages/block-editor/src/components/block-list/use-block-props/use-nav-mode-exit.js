/**
 * WordPress dependencies
 */
import { useRegistry } from '@wordpress/data';
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
	const registry = useRegistry();
	return useRefEffect(
		( node ) => {
			function onMouseDown( event ) {
				const { isNavigationMode, isBlockSelected } =
					registry.select( blockEditorStore );
				const { setNavigationMode, selectBlock } =
					registry.dispatch( blockEditorStore );
				// Don't select a block if it's already handled by a child
				// block.
				if ( isNavigationMode() && ! event.defaultPrevented ) {
					// Prevent focus from moving to the block.
					event.preventDefault();

					// When clicking on a selected block, exit navigation mode.
					if ( isBlockSelected( clientId ) ) {
						setNavigationMode( false );
					} else {
						selectBlock( clientId );
					}
				}
			}

			node.addEventListener( 'mousedown', onMouseDown );

			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
			};
		},
		[ clientId ]
	);
}
