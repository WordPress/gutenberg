/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

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

	// Intentionality left without any dependency.
	// This effect should only run when the component is rendered and unmounted.
	// The effect opens the zoom-out view if it is not open before when applying a style variation.
	useEffect( () => {
		if ( mode !== 'zoom-out' ) {
			__unstableSetEditorMode( 'zoom-out' );
			return () => {
				// Revert to original mode
				__unstableSetEditorMode( mode );
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
}
