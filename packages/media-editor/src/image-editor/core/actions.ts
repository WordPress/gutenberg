/**
 * Internal dependencies
 */
import type {
	CropperState,
	Flip,
	NormalizedPoint,
	NormalizedRect,
	TransformOperation,
} from './types';

/**
 * Internal actions for the cropper reducer.
 *
 * This action union is deliberately not exported from the image-editor public
 * barrel. Consumers should drive state through the controller returned by
 * `useCropperState()` or through serializable `TransformOperation` values.
 */
export type CropperAction =
	/** Sets the loaded image metadata (natural size, src). */
	| { type: 'SET_IMAGE'; payload: CropperState[ 'image' ] }
	/** Sets the image pan offset. (Crop rectangle is SET_CROP_RECT.) */
	| { type: 'SET_PAN'; payload: NormalizedPoint }
	/** Sets the zoom level, clamped to [1, MAX_ZOOM]. */
	| { type: 'SET_ZOOM'; payload: number }
	/**
	 * Sets zoom and pan together atomically. Used by focal-point
	 * zoom (wheel, pinch) to keep a target point stationary while
	 * zoom changes.
	 */
	| {
			type: 'SET_ZOOM_AT_POINT';
			payload: { zoom: number; pan: { x: number; y: number } };
	  }
	/** Sets the absolute rotation angle in degrees. */
	| { type: 'SET_ROTATION'; payload: number }
	/** Rotates by +/-90 degrees (snap). */
	| { type: 'SNAP_ROTATE_90'; payload: { direction: 1 | -1 } }
	/** Sets the flip state. */
	| { type: 'SET_FLIP'; payload: Flip }
	/** Sets the crop rectangle. */
	| { type: 'SET_CROP_RECT'; payload: NormalizedRect }
	/** Settle animation after resize drag, recentering the crop rect. */
	| { type: 'SETTLE_CROP' }
	/** Applies a single pipeline transform via the reducer. */
	| { type: 'APPLY_OPERATION'; payload: TransformOperation }
	/** Resets to DEFAULT_STATE, optionally merging a partial override. */
	| { type: 'RESET'; payload?: Partial< CropperState > };
