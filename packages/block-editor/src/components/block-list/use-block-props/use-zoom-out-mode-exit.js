/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
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
export function useZoomOutModeExit( { editorMode } ) {
	const { __unstableSetEditorMode } = unlock(
		useDispatch( blockEditorStore )
	);

	return useRefEffect(
		( node ) => {
			if ( editorMode !== 'zoom-out' ) {
				return;
			}

			function onDoubleClick( event ) {
				if ( ! event.defaultPrevented ) {
					event.preventDefault();
					__unstableSetEditorMode( 'edit' );
				}
			}

			node.addEventListener( 'dblclick', onDoubleClick );

			return () => {
				node.removeEventListener( 'dblclick', onDoubleClick );
			};
		},
		[ editorMode, __unstableSetEditorMode ]
	);
}
