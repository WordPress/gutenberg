/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';

/**
 * A hook used to set the editor mode to zoomed out mode, invoking the hook sets the mode.
 *
 * @param {boolean} zoomOut If we should enter into zoomOut mode or not
 */
export function useZoomOut( zoomOut = true ) {
	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );
	const { __unstableGetEditorMode } = useSelect( blockEditorStore );

	const originalEditingModeRef = useRef( null );
	const mode = __unstableGetEditorMode();

	useEffect( () => {
		// Only set this on mount so we know what to return to when we unmount.
		if ( ! originalEditingModeRef.current ) {
			originalEditingModeRef.current = mode;
		}

		return () => {
			// We need to use  __unstableGetEditorMode() here and not `mode`, as mode may not update on unmount
			if (
				__unstableGetEditorMode() === 'zoom-out' &&
				__unstableGetEditorMode() !== originalEditingModeRef.current
			) {
				__unstableSetEditorMode( originalEditingModeRef.current );
			}
		};
	}, [] );

	// The effect opens the zoom-out view if we want it open and it's not currently in zoom-out mode.
	useEffect( () => {
		if ( zoomOut && mode !== 'zoom-out' ) {
			__unstableSetEditorMode( 'zoom-out' );
		} else if (
			! zoomOut &&
			__unstableGetEditorMode() === 'zoom-out' &&
			originalEditingModeRef.current !== mode
		) {
			__unstableSetEditorMode( originalEditingModeRef.current );
		}
	}, [ __unstableGetEditorMode, __unstableSetEditorMode, zoomOut ] ); // Mode is deliberately excluded from the dependencies so that the effect does not run when mode changes.
}
