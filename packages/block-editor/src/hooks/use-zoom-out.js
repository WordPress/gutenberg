/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';

let originalEditingMode = null;

/**
 * A hook used to set the editor mode to zoomed out mode, invoking the hook sets the mode.
 *
 * @param {boolean} zoomOut If we should enter into zoomOut mode or not
 */
export function useZoomOut( zoomOut = true ) {
	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );
	const { __unstableGetEditorMode } = useSelect( blockEditorStore );

	useEffect( () => {
		// Only set this on mount so we know what to return to when we unmount.
		originalEditingMode = __unstableGetEditorMode();

		return () => {
			// We need to use  __unstableGetEditorMode() here and not `mode`, as mode may not update on unmount
			if ( __unstableGetEditorMode() !== originalEditingMode ) {
				__unstableSetEditorMode( originalEditingMode );
			}
		};
	}, [] );

	// The effect opens the zoom-out view if we want it open and it's not currently in zoom-out mode.
	useEffect( () => {
		const mode = __unstableGetEditorMode();
		if ( zoomOut && mode !== 'zoom-out' ) {
			__unstableSetEditorMode( 'zoom-out' );
		} else if ( ! zoomOut && originalEditingMode !== mode ) {
			__unstableSetEditorMode( originalEditingMode );
		}
	}, [ __unstableSetEditorMode, zoomOut ] );
}
