/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useRef, useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

export default function useOpenZoomOutOnPatterns() {
	const { mode } = useSelect( ( select ) => {
		return {
			mode: select( blockEditorStore ).__unstableGetEditorMode(),
		};
	}, [] );
	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );
	const shouldRevertInitialMode = useRef( null );
	useEffect( () => {
		// ignore changes to zoom-out mode as we explictily change to it on mount.
		if ( mode !== 'zoom-out' ) {
			shouldRevertInitialMode.current = false;
		}
	}, [ mode ] );
	return [
		useCallback( () => {
			__unstableSetEditorMode( 'zoom-out' );
			shouldRevertInitialMode.current = true;
		}, [] ),
		useCallback( () => {
			// if there were not mode changes revert to the initial mode when unmounting.
			if ( shouldRevertInitialMode.current ) {
				__unstableSetEditorMode( mode );
			}
		}, [] ),
	];
}
