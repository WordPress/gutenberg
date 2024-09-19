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
	const currentZoomOutState = isZoomOut();

	useEffect( () => {
		// Only set this on mount so we know what to return to when we unmount.
		if ( ! originalIsZoomOutRef.current ) {
			originalIsZoomOutRef.current = currentZoomOutState;
		}

		return () => {
			// We need to use  isZoomOut() here and not `currentZoomOutState`, as currentZoomOutState may not update on unmount
			if ( isZoomOut() && isZoomOut() !== originalIsZoomOutRef.current ) {
				setZoomLevel( originalIsZoomOutRef.current );
			}
		};
	}, [ currentZoomOutState, isZoomOut, setZoomLevel ] );

	// The effect opens the zoom-out view if we want it open and the canvas is not currently zoomed-out.
	useEffect( () => {
		if ( zoomOut && currentZoomOutState === false ) {
			// __unstableSetEditorMode( 'compose' );
			setZoomLevel( true );
		} else if (
			! zoomOut &&
			isZoomOut() &&
			originalIsZoomOutRef.current !== currentZoomOutState
		) {
			setZoomLevel( originalIsZoomOutRef.current );
		}
		// currentZoomOutState is deliberately excluded from the dependencies so that the effect does not run when mode changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isZoomOut, setZoomLevel, zoomOut ] );
}
