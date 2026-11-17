import { speak } from '@wordpress/a11y';
import { useEffect, useLayoutEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import type { InternalImageEditorState } from '../../core/types';
import { getOutputSize } from '../../get-output-size';

/** Debounce delay for ARIA live announcements (ms). */
const ARIA_DEBOUNCE_MS = 300;

function getFlipAnnouncement(
	state: InternalImageEditorState,
	previousState: InternalImageEditorState | null
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
	state: InternalImageEditorState,
	previousState: InternalImageEditorState | null
): string | undefined {
	if (
		previousState &&
		Math.round( previousState.rotation ) === Math.round( state.rotation )
	) {
		return undefined;
	}
	// Announce the visual rotation — what the user perceives on screen. A
	// single-axis flip mirrors the image, reversing the entire on-screen
	// rotation relative to the stored field (the same S·R·S inversion the
	// reducer applies), so negate the whole angle in that case.
	const singleFlip = state.flip.horizontal !== state.flip.vertical;
	const visualDir = singleFlip ? -1 : 1;
	// Normalize to (-180, 180] so the sign indicates direction.
	let visualRotation = ( Math.round( state.rotation ) * visualDir ) % 360;
	if ( visualRotation > 180 ) {
		visualRotation -= 360;
	}
	if ( visualRotation <= -180 ) {
		visualRotation += 360;
	}
	if ( visualRotation === 0 ) {
		return previousState ? __( 'Rotation 0 degrees' ) : undefined;
	}
	if ( visualRotation > 0 ) {
		return sprintf(
			/* translators: %d: rotation angle in degrees. */
			__( 'Rotated %d degrees clockwise' ),
			visualRotation
		);
	}
	return sprintf(
		/* translators: %d: rotation angle in degrees. */
		__( 'Rotated %d degrees counterclockwise' ),
		Math.abs( visualRotation )
	);
}

function getCropAnnouncement(
	state: InternalImageEditorState,
	previousState: InternalImageEditorState | null
): string | undefined {
	const size = getOutputSize( state );
	if ( ! size ) {
		return undefined;
	}
	// Announce only when the crop's pixel dimensions change. Measuring both the
	// previous and current crop rects under the current rotation and zoom keeps
	// the comparison in the same pixel units we announce, and leaves a zoom-only
	// change — which doesn't move the crop rect — silent.
	if ( previousState?.image ) {
		const previousSize = getOutputSize( {
			...state,
			cropRect: previousState.cropRect,
		} );
		if (
			previousSize &&
			Math.round( previousSize.width ) === Math.round( size.width ) &&
			Math.round( previousSize.height ) === Math.round( size.height )
		) {
			return undefined;
		}
	}
	return sprintf(
		/* translators: 1: crop width in pixels, 2: crop height in pixels. */
		__( 'Crop %1$d by %2$d pixels' ),
		Math.round( size.width ),
		Math.round( size.height )
	);
}

function getZoomAnnouncement(
	state: InternalImageEditorState,
	previousState: InternalImageEditorState | null
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
	state: InternalImageEditorState,
	previousState: InternalImageEditorState | null
): string {
	// Flip changes are announced alone.
	const flip = getFlipAnnouncement( state, previousState );
	if ( flip ) {
		return flip;
	}

	const parts = [
		getRotationAnnouncement( state, previousState ),
		getZoomAnnouncement( state, previousState ),
		getCropAnnouncement( state, previousState ),
	].filter( ( part ): part is string => part !== undefined );

	return parts.join( ', ' );
}

/**
 * Debounce and dedupe ARIA-live announcements for screen readers as the
 * editor state changes. Calls `speak()` from `@wordpress/a11y` to use the
 * centralized, persistent live region instead of a local one that may be
 * dynamically mounted.
 *
 * Debouncing avoids flooding announcements during drag/pointermove bursts;
 * deduping avoids re-announcing the same state.
 *
 * @param state The current editor state to announce.
 */
export function useAriaAnnouncer( state: InternalImageEditorState ): void {
	const timerRef = useRef< ReturnType< typeof setTimeout > | undefined >(
		undefined
	);
	const prevMessageRef = useRef( '' );
	const prevStateRef = useRef< InternalImageEditorState | null >( null );
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
				speak( msg );
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
}
