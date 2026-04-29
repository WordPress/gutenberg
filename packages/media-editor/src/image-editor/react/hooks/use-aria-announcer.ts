/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { CropperState } from '../../core/types';

/** Debounce delay for ARIA live announcements (ms). */
const ARIA_DEBOUNCE_MS = 300;

// Build a human-readable announcement string from cropper state.
function buildAnnouncement( state: CropperState ): string {
	const parts: string[] = [];
	parts.push( `Zoom ${ Math.round( state.zoom * 100 ) }%` );
	if ( state.rotation !== 0 ) {
		parts.push( `Rotation ${ Math.round( state.rotation ) } degrees` );
	}
	const cropW = Math.round( state.cropRect.width * 100 );
	const cropH = Math.round( state.cropRect.height * 100 );
	parts.push( `Crop ${ cropW }% by ${ cropH }%` );
	return parts.join( ', ' );
}

/**
 * Debounce and dedupe ARIA-live announcements for screen readers as the
 * cropper state changes. Returns the current announcement message to render
 * inside an `aria-live="polite"` region.
 *
 * Debouncing avoids flooding the live region during drag/pointermove bursts;
 * deduping avoids re-announcing the same state.
 *
 * @param state The current cropper state to announce.
 */
export function useAriaAnnouncer( state: CropperState ): string {
	const [ ariaMessage, setAriaMessage ] = useState( '' );
	const timerRef = useRef< ReturnType< typeof setTimeout > >();
	const prevMessageRef = useRef( '' );

	useEffect( () => {
		clearTimeout( timerRef.current );
		timerRef.current = setTimeout( () => {
			const msg = buildAnnouncement( state );
			if ( msg !== prevMessageRef.current ) {
				prevMessageRef.current = msg;
				setAriaMessage( msg );
			}
		}, ARIA_DEBOUNCE_MS );

		return () => {
			clearTimeout( timerRef.current );
		};
	}, [
		state.zoom,
		state.rotation,
		state.cropRect.width,
		state.cropRect.height,
		state,
	] );

	return ariaMessage;
}
