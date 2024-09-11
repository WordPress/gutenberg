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
	const { __unstableSetEditorMode } = unlock(
		useDispatch( blockEditorStore )
	);

	const { setIsInserterOpened } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );

		const { __experimentalSetIsInserterOpened } = getSettings();

		return {
			setIsInserterOpened: __experimentalSetIsInserterOpened,
		};
	}, [] );

	return useRefEffect(
		( node ) => {
			if ( editorMode !== 'zoom-out' ) {
				return;
			}

			function onDoubleClick( event ) {
				if ( ! event.defaultPrevented ) {
					event.preventDefault();
					// Setting may be undefined.
					if ( typeof setIsInserterOpened === 'function' ) {
						setIsInserterOpened( false );
					}
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
