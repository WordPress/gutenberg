/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

/**
 * Allows Zoom Out mode to be exited by double clicking in the selected block.
 *
 * @param {string} clientId Block client ID.
 */
export function useZoomOutModeExit( clientId ) {
	const { isZoomOutMode } = unlock( useSelect( blockEditorStore ) );
	const { __unstableSetEditorMode, selectBlock } = unlock(
		useDispatch( blockEditorStore )
	);

	return useRefEffect(
		( node ) => {
			function onDoubleClick( event ) {
				// Don't select a block if it's already handled by a child
				// block.
				if ( isZoomOutMode() && ! event.defaultPrevented ) {
					// Prevent focus from moving to the block.
					event.preventDefault();

					__unstableSetEditorMode( 'edit' );
					selectBlock( clientId );
				}
			}

			node.addEventListener( 'dblclick', onDoubleClick );

			return () => {
				node.removeEventListener( 'dblclick', onDoubleClick );
			};
		},
		[ clientId, isZoomOutMode, __unstableSetEditorMode ]
	);
}
