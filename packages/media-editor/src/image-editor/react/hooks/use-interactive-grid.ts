/**
 * WordPress dependencies
 */
import { useState, useCallback, useRef, useEffect } from '@wordpress/element';

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
 * Returns `gridVisible` (whether to show the grid at full opacity), plus
 * `notifyResizeStart` / `notifyResizeEnd` — call these from the host component
 * when a crop-handle resize begins and ends, since resize events live outside
 * `useInteraction`.
 *
 * When `showGrid` is not `'interactive'`, all returned values are inert and no
 * timers are scheduled.
 *
 * @param root0                        Destructured options.
 * @param root0.showGrid               Grid mode prop from the Cropper.
 * @param root0.isPlacementInteracting Whether a drag/pan is in progress (from useInteraction).
 * @param root0.isDirty                Whether the user has made any edits.
 * @param root0.state                  Current cropper state (read for placement values).
 * @return gridVisible, notifyResizeStart, notifyResizeEnd.
 */
export function useInteractiveGrid( {
	showGrid,
	isPlacementInteracting,
	isDirty,
	state,
}: {
	showGrid: boolean | 'interactive';
	isPlacementInteracting: boolean;
	isDirty: boolean;
	state: CropperState;
} ): {
	gridVisible: boolean;
	notifyResizeStart: () => void;
	notifyResizeEnd: () => void;
} {
	const [ gridVisible, setGridVisible ] = useState( false );
	const [ isResizing, setIsResizing ] = useState( false );
	const gridFadeTimerRef = useRef< ReturnType< typeof setTimeout > >();
	const previousSnapshotRef = useRef( snapshotPlacement( state ) );
	const isCropperInteracting = isPlacementInteracting || isResizing;

	useEffect( () => {
		if ( showGrid !== 'interactive' ) {
			return;
		}

		const previous = previousSnapshotRef.current;
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

		// Always cancel any pending fade before deciding what to do next.
		clearTimeout( gridFadeTimerRef.current );

		// Keep the grid visible for the full duration of any placement gesture.
		if ( isCropperInteracting ) {
			setGridVisible( true );
			return () => clearTimeout( gridFadeTimerRef.current );
		}

		// Flash briefly when zoom or pan changes via a non-gesture (e.g. slider).
		// Skips flips, rotations, and aspect-ratio-driven crop changes.
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
				setGridVisible( true );
				return () => clearTimeout( gridFadeTimerRef.current );
			}
		}

		// Schedule fade-out if the grid is currently visible (interaction or
		// flash just ended and this effect re-ran with gridVisible = true).
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

	const notifyResizeStart = useCallback( () => {
		setIsResizing( true );
	}, [] );

	const notifyResizeEnd = useCallback( () => {
		setIsResizing( false );
	}, [] );

	return { gridVisible, notifyResizeStart, notifyResizeEnd };
}
