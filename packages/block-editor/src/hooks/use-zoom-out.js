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
 */
export function useZoomOut() {
	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );
	const { mode } = useSelect( ( select ) => {
		return {
			mode: select( blockEditorStore ).__unstableGetEditorMode(),
		};
	}, [] );

	const shouldRevertInitialMode = useRef( null );
	useEffect( () => {
		// ignore changes to zoom-out mode as we explictily change to it on mount.
		if ( mode !== 'zoom-out' ) {
			shouldRevertInitialMode.current = false;
		}
	}, [ mode ] );

	// Intentionality left without any dependency.
	// This effect should only run the first time the component is rendered.
	// The effect opens the zoom-out view if it is not open before when applying a style variation.
	useEffect( () => {
		if ( mode !== 'zoom-out' ) {
			__unstableSetEditorMode( 'zoom-out' );
			shouldRevertInitialMode.current = true;
			return () => {
				// if there were not mode changes revert to the initial mode when unmounting.
				if ( shouldRevertInitialMode.current ) {
					__unstableSetEditorMode( mode );
				}
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
}
