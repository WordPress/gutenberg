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
	const { mode } = useSelect( ( select ) => {
		return {
			mode: select( blockEditorStore ).__unstableGetEditorMode(),
		};
	}, [] );

	const originalEditingMode = useRef( null );

	useEffect( () => {
		// Only set this on mount so we know what to return to when we unmount.
		if ( ! originalEditingMode.current ) {
			originalEditingMode.current = mode;
		}

		return () => {
			// Reset to original mode on unmount
			__unstableSetEditorMode( originalEditingMode.current );
		};
	}, [] );

	// The effect opens the zoom-out view if we want it open and it's not currently in zoom-out mode.
	useEffect( () => {
		if ( zoomOut && mode !== 'zoom-out' ) {
			__unstableSetEditorMode( 'zoom-out' );
		} else if ( ! zoomOut && originalEditingMode.current !== mode ) {
			__unstableSetEditorMode( originalEditingMode.current );
		}
	}, [ zoomOut, mode ] );
}
