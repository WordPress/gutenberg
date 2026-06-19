/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	useLayoutEffect,
	useRef,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { CropperState } from '../../core/types';

/** Debounce delay for ARIA live announcements (ms). */
const ARIA_DEBOUNCE_MS = 300;

function buildFlipAnnouncement( state: CropperState ): string {
	const { horizontal, vertical } = state.flip;
	if ( horizontal && vertical ) {
		return __( 'Flipped horizontally and vertically' );
	}
	if ( horizontal ) {
		return __( 'Flipped horizontally' );
	}
	if ( vertical ) {
		return __( 'Flipped vertically' );
	}
	return __( 'Flip removed' );
}

// Build a human-readable announcement string from cropper state.
function buildAnnouncement(
	state: CropperState,
	previousState: CropperState | null
): string {
	if (
		previousState &&
		( previousState.flip.horizontal !== state.flip.horizontal ||
			previousState.flip.vertical !== state.flip.vertical )
	) {
		return buildFlipAnnouncement( state );
	}

	const parts: string[] = [];
	parts.push(
		sprintf(
			/* translators: %d: zoom level as a percentage. */
			__( 'Zoom %d%%' ),
			Math.round( state.zoom * 100 )
		)
	);
	if ( state.rotation !== 0 ) {
		parts.push(
			sprintf(
				/* translators: %d: rotation angle in degrees. */
				__( 'Rotation %d degrees' ),
				Math.round( state.rotation )
			)
		);
	}
	const cropW = Math.round( state.cropRect.width * 100 );
	const cropH = Math.round( state.cropRect.height * 100 );
	parts.push(
		sprintf(
			/* translators: 1: crop width as a percentage, 2: crop height as a percentage. */
			__( 'Crop %1$d%% by %2$d%%' ),
			cropW,
			cropH
		)
	);
	if ( state.flip.horizontal || state.flip.vertical ) {
		parts.push( buildFlipAnnouncement( state ) );
	}
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
	const prevStateRef = useRef< CropperState | null >( null );
	const latestStateRef = useRef( state );
	useLayoutEffect( () => {
		latestStateRef.current = state;
	}, [ state ] );

	useEffect( () => {
		clearTimeout( timerRef.current );
		timerRef.current = setTimeout( () => {
			const current = latestStateRef.current;
			const msg = buildAnnouncement( current, prevStateRef.current );
			prevStateRef.current = current;
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
		state.flip.horizontal,
		state.flip.vertical,
	] );

	return ariaMessage;
}
