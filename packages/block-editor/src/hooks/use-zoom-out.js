/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
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

	const originalEditingMode = useRef( null );

	useEffect( () => {
		// Only set this on mount so we know what to return to when we unmount.
		if ( ! originalEditingMode.current ) {
			originalEditingMode.current = __unstableGetEditorMode();
		}

		if ( zoomOut && __unstableGetEditorMode() !== 'zoom-out' ) {
			__unstableSetEditorMode( 'zoom-out' );
		} else if (
			! zoomOut &&
			__unstableGetEditorMode() === 'zoom-out' &&
			originalEditingMode.current !== __unstableGetEditorMode()
		) {
			__unstableSetEditorMode( originalEditingMode.current );
		}

		return () => {
			// Restore the original mode on unmount if it was changed to 'zoom-out'
			if (
				__unstableGetEditorMode() === 'zoom-out' &&
				__unstableGetEditorMode() !== originalEditingMode.current
			) {
				__unstableSetEditorMode( originalEditingMode.current );
			}
		};
	}, [ zoomOut, __unstableGetEditorMode, __unstableSetEditorMode ] );
}
