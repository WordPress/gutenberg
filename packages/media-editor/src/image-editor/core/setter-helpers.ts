/**
 * Internal dependencies
 */
import type { CropperState, NormalizedPoint, CropperAction } from './types';
import { MAX_ZOOM } from './constants';
import { getMinZoom, restrictPanZoom } from './containment';

/**
 * Build the reducer action that produces a "cursorless" zoom — zoom
 * anchored at the current crop-rect center, with pan clamped to keep
 * the image covering the crop.
 *
 * The slider, the `+`/`-` keys, and the toolbar buttons have no
 * natural focal point (unlike wheel/pinch zoom), so they default to
 * the crop center. Returns `null` when the clamped zoom matches the
 * current zoom (no-op).
 *
 * Extracted so multiple hooks (the pure `useCropperReducer` and the
 * composite `useMediaEditorState`) can share the math without
 * duplicating it.
 *
 * @param state         The current cropper state.
 * @param requestedZoom The zoom value the caller asked for.
 * @return A `SET_ZOOM_AT_POINT` action, or `null` if no change is required.
 */
export function buildFocalPointZoomAction(
	state: CropperState,
	requestedZoom: number
): CropperAction | null {
	const clampedZoom = Math.min(
		MAX_ZOOM,
		Math.max( getMinZoom( state ), requestedZoom )
	);
	if ( clampedZoom === state.zoom ) {
		return null;
	}
	// Crop center expressed in the same coord system as `state.pan`:
	// container-center-relative, normalized by image rendered size.
	// `cropRect` is image-top-left-origin (0–1), so subtract 0.5
	// to recenter.
	const { cropRect } = state;
	const focalNormX = cropRect.x + cropRect.width / 2 - 0.5;
	const focalNormY = cropRect.y + cropRect.height / 2 - 0.5;
	const zoomRatio = 1 - clampedZoom / state.zoom;
	const newPanX = state.pan.x + ( focalNormX - state.pan.x ) * zoomRatio;
	const newPanY = state.pan.y + ( focalNormY - state.pan.y ) * zoomRatio;
	const imageSize: { width: number; height: number } = state.image
		? {
				width: state.image.naturalWidth,
				height: state.image.naturalHeight,
		  }
		: { width: 1, height: 1 };
	const { pan: clampedPan }: { pan: NormalizedPoint } = restrictPanZoom(
		{
			...state,
			zoom: clampedZoom,
			pan: { x: newPanX, y: newPanY },
		},
		imageSize,
		state.cropRect
	);
	return {
		type: 'SET_ZOOM_AT_POINT',
		payload: { zoom: clampedZoom, pan: clampedPan },
	};
}
