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
import { getSourceRegion } from '../../core/source-region';

/** Debounce delay for ARIA live announcements (ms). */
const ARIA_DEBOUNCE_MS = 300;

function getFlipAnnouncement(
	state: CropperState,
	previousState: CropperState | null
): string | undefined {
	if (
		! previousState ||
		( previousState.flip.horizontal === state.flip.horizontal &&
			previousState.flip.vertical === state.flip.vertical )
	) {
		return undefined;
	}
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

function getRotationAnnouncement(
	state: CropperState,
	previousState: CropperState | null
): string | undefined {
	if ( ! previousState ) {
		const rounded = Math.round( state.rotation % 360 );
		if ( rounded === 0 ) {
			return undefined;
		}
		return sprintf(
			/* translators: %d: rotation angle in degrees. */
			__( 'Rotation %d degrees' ),
			rounded
		);
	}

	if (
		Math.round( previousState.rotation ) === Math.round( state.rotation )
	) {
		return undefined;
	}

	const rounded = Math.round( state.rotation % 360 );
	// Compute signed shortest-arc delta to determine direction.
	let delta = ( state.rotation - previousState.rotation ) % 360;
	if ( delta > 180 ) {
		delta -= 360;
	}
	if ( delta < -180 ) {
		delta += 360;
	}
	if ( rounded === 0 ) {
		return __( 'Rotation 0 degrees' );
	}
	if ( delta > 0 ) {
		return sprintf(
			/* translators: %d: rotation angle in degrees. */
			__( 'Rotated %d degrees clockwise' ),
			rounded
		);
	}
	if ( delta < 0 ) {
		return sprintf(
			/* translators: %d: rotation angle in degrees. */
			__( 'Rotated %d degrees counterclockwise' ),
			360 - rounded
		);
	}
	return undefined;
}

function getCropAnnouncement(
	state: CropperState,
	previousState: CropperState | null
): string | undefined {
	if (
		previousState &&
		Math.round( previousState.cropRect.width * 100 ) ===
			Math.round( state.cropRect.width * 100 ) &&
		Math.round( previousState.cropRect.height * 100 ) ===
			Math.round( state.cropRect.height * 100 )
	) {
		return undefined;
	}
	if ( ! state.image ) {
		return undefined;
	}
	const region = getSourceRegion( state, {
		width: state.image.naturalWidth,
		height: state.image.naturalHeight,
	} );
	return sprintf(
		/* translators: 1: crop width in pixels, 2: crop height in pixels. */
		__( 'Crop %1$d by %2$d pixels' ),
		Math.round( region.width ),
		Math.round( region.height )
	);
}

function getZoomAnnouncement(
	state: CropperState,
	previousState: CropperState | null
): string | undefined {
	if (
		previousState &&
		Math.round( previousState.zoom * 100 ) ===
			Math.round( state.zoom * 100 )
	) {
		return undefined;
	}
	return sprintf(
		/* translators: %d: zoom level as a percentage. */
		__( 'Zoom %d%%' ),
		Math.round( state.zoom * 100 )
	);
}

function buildAnnouncement(
	state: CropperState,
	previousState: CropperState | null
): string {
	// Flip changes are announced alone.
	const flip = getFlipAnnouncement( state, previousState );
	if ( flip ) {
		return flip;
	}

	const parts = [
		getZoomAnnouncement( state, previousState ),
		getRotationAnnouncement( state, previousState ),
		getCropAnnouncement( state, previousState ),
	].filter( ( part ): part is string => part !== undefined );

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
