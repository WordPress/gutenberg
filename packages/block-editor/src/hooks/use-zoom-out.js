/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import { useViewportMatch } from '@wordpress/compose';

/**
 * A hook used to set the editor mode to zoomed out mode, invoking the hook sets the mode.
 *
 * @param {boolean} zoomOut If we should enter into zoomOut mode or not
 */
export function useZoomOut( zoomOut = true ) {
	const { setZoomLevel, resetZoomLevel } = unlock(
		useDispatch( blockEditorStore )
	);
	const { isZoomOut } = unlock( useSelect( blockEditorStore ) );
	const isWideViewport = useViewportMatch( 'large' );

	useEffect( () => {
		const isZoomOutOnMount = isZoomOut();

		return () => {
			if ( isZoomOutOnMount && isWideViewport ) {
				setZoomLevel( 'auto-scaled' );
			} else {
				resetZoomLevel();
			}
		};
	}, [] );

	useEffect( () => {
		if ( zoomOut && isWideViewport ) {
			setZoomLevel( 'auto-scaled' );
		} else {
			resetZoomLevel();
		}
	}, [ zoomOut, setZoomLevel, resetZoomLevel, isWideViewport ] );
}
