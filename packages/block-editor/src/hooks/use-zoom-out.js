/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

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
	const programmaticZoomOutChange = useRef( null );

	useEffect( () => {
		const isZoomOutOnMount = isZoomOut();

		return () => {
			// We never changed modes for them, so there is nothing to do.
			if ( programmaticZoomOutChange.current === null ) {
				return;
			}

			// If we exited zoom out for them and they were originally in zoom out mode, enter zoom out again.
			if (
				programmaticZoomOutChange.current === false &&
				isZoomOutOnMount &&
				isWideViewport
			) {
				setZoomLevel( 'auto-scaled' );
			}
			// We entered zoom out for them, and they were not originally in zoom out mode, so reset the zoom level.
			else if (
				programmaticZoomOutChange.current === true &&
				isZoomOut() &&
				! isZoomOutOnMount
			) {
				resetZoomLevel();
			}
		};
	}, [] );

	useEffect( () => {
		if ( zoomOut && ! isZoomOut() && isWideViewport ) {
			programmaticZoomOutChange.current = true;
			setZoomLevel( 'auto-scaled' );
		} else if ( ! zoomOut && isZoomOut() ) {
			programmaticZoomOutChange.current = false;
			resetZoomLevel();
		}
	}, [ zoomOut, isZoomOut, setZoomLevel, resetZoomLevel, isWideViewport ] );
}
