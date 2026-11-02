import type { CropperControllerState, NormalizedRect, Size } from '../core';
import type { CropperAction } from '../core/types';

/**
 * Crop options that share the undo history with the cropper state.
 */
export interface CropOptions {
	/**
	 * Selected aspect-ratio preset as a string (round-trippable through
	 * a select control). `'0'` = Free, `'-1'` = Original, any positive
	 * decimal = fixed ratio.
	 */
	aspectRatioValue: string;
}

/**
 * The crop options a session starts from.
 */
export const DEFAULT_CROP_OPTIONS: CropOptions = {
	aspectRatioValue: '0',
};

/**
 * The state a crop session holds: the cropper state and the crop
 * options. Every undo/redo snapshot is a full state.
 *
 * A session can hold more than this: `useCropSession` accepts a reducer
 * for a wider state that still includes these two slices.
 */
export interface CropSessionState {
	cropper: CropperControllerState;
	cropOptions: CropOptions;
}

/**
 * Actions the crop session reducer handles. `S` is the full session
 * state, so a snapshot of a wider state can be restored.
 */
export type CropSessionAction< S extends CropSessionState = CropSessionState > =
	/**
	 * Delegate to the cropper reducer. Used for every geometry change
	 * (pan / zoom / rotation / flip / cropRect / settle / etc.).
	 */
	| {
			type: 'CROPPER';
			action: CropperAction;
	  }
	/**
	 * Set the aspect-ratio preset. Updates the preset and reshapes the
	 * cropRect in one step, so it is one undo entry.
	 */
	| {
			type: 'SET_ASPECT_RATIO_VALUE';
			payload: {
				/** Preset key as it appears in the dropdown. */
				presetKey: string;
				/**
				 * Resolved width/height ratio. `undefined` = Free
				 * (no lock; cropRect stays where it is).
				 */
				resolved: number | undefined;
				/**
				 * Rendered image size used to compute the inscribed
				 * rect. The caller supplies it because the reducer has
				 * no DOM access.
				 */
				visualSize: Size;
			};
	  }
	/**
	 * Put the geometry and crop options back to their starting state,
	 * keeping the image. One action, so one undo entry.
	 */
	| { type: 'RESET' }
	/**
	 * Replace the whole state with `payload`. Used by undo/redo to
	 * restore a snapshot.
	 */
	| { type: 'RESTORE_SNAPSHOT'; payload: S }
	/**
	 * Adjust the cropRect after a viewport change (e.g., window resize).
	 * Behaves like a `CROPPER SET_CROP_RECT`, but the session does not
	 * record it in the undo history.
	 */
	| {
			type: 'VIEWPORT_ADJUST_CROP_RECT';
			payload: NormalizedRect;
	  };
