/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

/**
 * Allows Zoom Out mode to be exited by double clicking in the selected block.
 */
export function useZoomOutModeExit() {
	const { getSettings, isZoomOut } = unlock( useSelect( blockEditorStore ) );
	const { resetZoomLevel } = unlock( useDispatch( blockEditorStore ) );

	return useCallback(
		( node ) => {
			if ( ! node ) {
				return;
			}
			function onDoubleClick( event ) {
				if ( ! isZoomOut() ) {
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
					resetZoomLevel();
				}
			}

			node.addEventListener( 'dblclick', onDoubleClick );

			return () => {
				node.removeEventListener( 'dblclick', onDoubleClick );
			};
		},
		[ getSettings, isZoomOut, resetZoomLevel ]
	);
}
