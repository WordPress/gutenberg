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
 */
export function useZoomOutModeExit() {
	const { getSettings, isZoomOut, __unstableGetEditorMode } = unlock(
		useSelect( blockEditorStore )
	);

	const { __unstableSetEditorMode, resetZoomLevel } = unlock(
		useDispatch( blockEditorStore )
	);

	return useRefEffect(
		( node ) => {
			function onDoubleClick( event ) {
				// In "compose" mode.
				const composeMode =
					__unstableGetEditorMode() === 'zoom-out' && isZoomOut();

				if ( ! composeMode ) {
					return;
				}

				if ( ! event.defaultPrevented ) {
					event.preventDefault();

					const { __experimentalSetIsInserterOpened } = getSettings();

					if (
						typeof __experimentalSetIsInserterOpened === 'function'
					) {
						__experimentalSetIsInserterOpened( false );
					}
					__unstableSetEditorMode( 'edit' );
					resetZoomLevel();
				}
			}

			node.addEventListener( 'dblclick', onDoubleClick );

			return () => {
				node.removeEventListener( 'dblclick', onDoubleClick );
			};
		},
		[
			getSettings,
			__unstableSetEditorMode,
			__unstableGetEditorMode,
			isZoomOut,
			resetZoomLevel,
		]
	);
}
