/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { CropperState } from '../../core/types';

/** How long to wait after the last placement change before fading the grid out. */
const GRID_FADE_DELAY_MS = 100;

type PlacementSnapshot = {
	zoom: number;
	panX: number;
	panY: number;
	rotation: number;
	flipHorizontal: boolean;
	flipVertical: boolean;
	cropX: number;
	cropY: number;
	cropWidth: number;
	cropHeight: number;
};

function snapshotPlacement( state: CropperState ): PlacementSnapshot {
	return {
		zoom: state.zoom,
		panX: state.pan.x,
		panY: state.pan.y,
		rotation: state.rotation,
		flipHorizontal: state.flip.horizontal,
		flipVertical: state.flip.vertical,
		cropX: state.cropRect.x,
		cropY: state.cropRect.y,
		cropWidth: state.cropRect.width,
		cropHeight: state.cropRect.height,
	};
}

/**
 * Manages the rule-of-thirds grid visibility for interactive mode.
 *
 * In `'interactive'` mode the grid is shown while the user is performing a
 * placement gesture (pan, drag, crop-resize) and briefly flashes when zoom or
 * pan changes without a direct gesture (e.g. slider input). It fades out
 * shortly after the interaction ends.
 *
 * Returns `gridVisible` — whether the grid should be shown at full opacity.
 * When `showGrid` is not `'interactive'`, the effect exits immediately and
 * `gridVisible` stays `false`.
 *
 * Design note — single merged effect: the interaction path and the zoom-flash
 * path share one fade timer. They must both be able to cancel each other's
 * pending fade (e.g. a zoom change while the drag-end timer is counting down
 * should reset the delay). A single effect with one timer ref is the only way
 * to guarantee that without introducing shared mutable state across effects.
 *
 * @param root0                      Destructured options.
 * @param root0.showGrid             Grid mode prop from the Cropper.
 * @param root0.isCropperInteracting True while any placement gesture is active.
 * @param root0.isDirty              Whether the user has made any edits.
 * @param root0.state                Current cropper state (read for placement values).
 * @return gridVisible.
 */
export function useInteractiveGrid( {
	showGrid,
	isCropperInteracting,
	isDirty,
	state,
}: {
	showGrid: boolean | 'interactive';
	isCropperInteracting: boolean;
	isDirty: boolean;
	state: CropperState;
} ): {
	gridVisible: boolean;
} {
	const [ gridVisible, setGridVisible ] = useState( false );
	const gridFadeTimerRef = useRef< ReturnType< typeof setTimeout > >();
	const previousSnapshotRef = useRef( snapshotPlacement( state ) );

	useEffect( () => {
		// All paths other than 'interactive' are intentional no-ops.
		if ( showGrid !== 'interactive' ) {
			return;
		}

		const previous = previousSnapshotRef.current;
		// Inline field reads rather than snapshotPlacement(state) so the
		// exhaustive-deps rule can confirm every accessed field is in the
		// deps array below.
		const current: PlacementSnapshot = {
			zoom: state.zoom,
			panX: state.pan.x,
			panY: state.pan.y,
			rotation: state.rotation,
			flipHorizontal: state.flip.horizontal,
			flipVertical: state.flip.vertical,
			cropX: state.cropRect.x,
			cropY: state.cropRect.y,
			cropWidth: state.cropRect.width,
			cropHeight: state.cropRect.height,
		};
		previousSnapshotRef.current = current;

		// Keep the grid visible for the full duration of any placement gesture.
		// Cancel any pending fade so the timer resets if the user re-engages.
		if ( isCropperInteracting ) {
			clearTimeout( gridFadeTimerRef.current );
			setGridVisible( true );
			return () => clearTimeout( gridFadeTimerRef.current );
		}

		// Flash briefly when zoom or pan changes via a non-gesture (e.g. slider).
		// Skips flips, rotations, and aspect-ratio-driven crop-rect changes.
		//
		// The timer is scheduled here directly rather than relying on a
		// subsequent effect re-run, because if gridVisible is already true,
		// setGridVisible(true) is a no-op — React won't re-render, the
		// fade-scheduling branch below is never reached, and the grid gets stuck.
		if ( isDirty ) {
			const zoomOrPanChanged =
				previous.zoom !== current.zoom ||
				previous.panX !== current.panX ||
				previous.panY !== current.panY;
			const cropRectChanged =
				previous.cropX !== current.cropX ||
				previous.cropY !== current.cropY ||
				previous.cropWidth !== current.cropWidth ||
				previous.cropHeight !== current.cropHeight;
			const orientationChanged =
				previous.rotation !== current.rotation ||
				previous.flipHorizontal !== current.flipHorizontal ||
				previous.flipVertical !== current.flipVertical;

			if (
				zoomOrPanChanged &&
				! cropRectChanged &&
				! orientationChanged
			) {
				clearTimeout( gridFadeTimerRef.current );
				setGridVisible( true );
				gridFadeTimerRef.current = setTimeout( () => {
					setGridVisible( false );
				}, GRID_FADE_DELAY_MS );
				return () => clearTimeout( gridFadeTimerRef.current );
			}
		}

		// Schedule fade-out if the grid is visible and nothing above is keeping
		// it open. Reached when interaction ends (isCropperInteracting → false)
		// or when gridVisible flips true (causing a re-run with no new trigger).
		if ( gridVisible ) {
			gridFadeTimerRef.current = setTimeout( () => {
				setGridVisible( false );
			}, GRID_FADE_DELAY_MS );
		}

		return () => clearTimeout( gridFadeTimerRef.current );
	}, [
		showGrid,
		isCropperInteracting,
		gridVisible,
		isDirty,
		// Placement values — needed for zoom-flash detection only, but must
		// always be in the deps array because the snapshot is updated on every
		// run (including during interaction) to keep it current.
		state.zoom,
		state.pan.x,
		state.pan.y,
		state.rotation,
		state.flip.horizontal,
		state.flip.vertical,
		state.cropRect.x,
		state.cropRect.y,
		state.cropRect.width,
		state.cropRect.height,
	] );

	return { gridVisible };
}
