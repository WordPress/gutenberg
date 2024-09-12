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
export function useZoomOutModeExit( { editorMode } ) {
	const { getEditorMode } = useSelect( ( select ) => {
		const { __unstableGetEditorMode } = select( blockEditorStore );
		return {
			getEditorMode: __unstableGetEditorMode,
		};
	}, [] );

	const { __unstableSetEditorMode, setZoomOut } = unlock(
		useDispatch( blockEditorStore )
	);

	return useRefEffect(
		( node ) => {
			if ( editorMode !== 'compose' ) {
				return;
			}

			function onDoubleClick( event ) {
				if ( ! event.defaultPrevented ) {
					event.preventDefault();
					if ( getEditorMode() === 'compose' ) {
						__unstableSetEditorMode( 'edit' );
						setZoomOut( false );
					}
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
