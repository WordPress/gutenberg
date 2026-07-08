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

function buildRotationAnnouncement(
	degrees: number,
	previousDegrees?: number
): string {
	const rounded = Math.round( degrees % 360 );
	if ( rounded === 0 ) {
		return __( 'Rotation 0 degrees' );
	}

	if ( previousDegrees !== undefined ) {
		// Compute signed shortest-arc delta to determine direction.
		let delta = ( degrees - previousDegrees ) % 360;
		if ( delta > 180 ) {
			delta -= 360;
		}
		if ( delta < -180 ) {
			delta += 360;
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
	}

	return sprintf(
		/* translators: %d: rotation angle in degrees. */
		__( 'Rotation %d degrees' ),
		rounded
	);
}

function buildCropAnnouncement( state: CropperState ): string {
	if ( state.image ) {
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
	const cropW = Math.round( state.cropRect.width * 100 );
	const cropH = Math.round( state.cropRect.height * 100 );
	return sprintf(
		/* translators: 1: crop width as a percentage, 2: crop height as a percentage. */
		__( 'Crop width %1$d%%, height %2$d%%' ),
		cropW,
		cropH
	);
}

function buildZoomAnnouncement( state: CropperState ): string {
	return sprintf(
		/* translators: %d: zoom level as a percentage. */
		__( 'Zoom %d%%' ),
		Math.round( state.zoom * 100 )
	);
}

// Build a human-readable announcement string from cropper state,
// leading with the value that actually changed.
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

	if ( previousState ) {
		const rotationChanged =
			Math.round( previousState.rotation ) !==
			Math.round( state.rotation );
		const zoomChanged =
			Math.round( previousState.zoom * 100 ) !==
			Math.round( state.zoom * 100 );
		const cropChanged =
			Math.round( previousState.cropRect.width * 100 ) !==
				Math.round( state.cropRect.width * 100 ) ||
			Math.round( previousState.cropRect.height * 100 ) !==
				Math.round( state.cropRect.height * 100 );

		if ( rotationChanged && ! zoomChanged && ! cropChanged ) {
			return buildRotationAnnouncement(
				state.rotation,
				previousState.rotation
			);
		}
		if ( cropChanged && ! zoomChanged && ! rotationChanged ) {
			return buildCropAnnouncement( state );
		}
		if ( zoomChanged && ! rotationChanged && ! cropChanged ) {
			return buildZoomAnnouncement( state );
		}
	}

	// Multiple values changed or no previous state — announce all.
	const parts: string[] = [];
	parts.push( buildZoomAnnouncement( state ) );
	if ( state.rotation !== 0 ) {
		parts.push(
			buildRotationAnnouncement( state.rotation, previousState?.rotation )
		);
	}
	parts.push( buildCropAnnouncement( state ) );
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
