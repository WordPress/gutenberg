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

/**
 * A hook used to set the zoomed out view, invoking the hook sets the mode.
 *
 * @param {boolean} zoomOut If we should zoom out or not.
 */
export function useZoomOut( zoomOut = true ) {
	const { setZoomLevel } = unlock( useDispatch( blockEditorStore ) );
	const { isZoomOut } = unlock( useSelect( blockEditorStore ) );

	const originalIsZoomOutRef = useRef( null );

	useEffect( () => {
		// Only set this on mount so we know what to return to when we unmount.
		if ( ! originalIsZoomOutRef.current ) {
			originalIsZoomOutRef.current = isZoomOut();
		}

		// The effect opens the zoom-out view if we want it open and the canvas is not currently zoomed-out.
		if ( zoomOut && isZoomOut() === false ) {
			setZoomLevel( 50 );
		} else if (
			! zoomOut &&
			isZoomOut() &&
			originalIsZoomOutRef.current !== isZoomOut()
		) {
			setZoomLevel( originalIsZoomOutRef.current ? 50 : 100 );
		}

		return () => {
			if ( isZoomOut() && isZoomOut() !== originalIsZoomOutRef.current ) {
				setZoomLevel( originalIsZoomOutRef.current ? 50 : 100 );
			}
		};
	}, [ isZoomOut, setZoomLevel, zoomOut ] );
}
