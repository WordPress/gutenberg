/**
 * Internal dependencies
 */
import type {
	CropperAction,
	CropperState,
	NormalizedRect,
	Size,
} from '../image-editor';

/**
 * Sidebar control state for the cropper. Lives in the composite store
 * so it participates in the same undo history as cropper geometry.
 */
export interface CropOptionsSlice {
	/**
	 * Selected aspect-ratio preset as a string (round-trippable through
	 * `<SelectControl>`). `'0'` = Free, `'-1'` = Original, any positive
	 * decimal = fixed ratio.
	 */
	aspectRatioValue: string;
}

/**
 * Default values for the crop-options slice. Mirrors the initial state
 * used by the sidebar before the user has touched anything.
 */
export const DEFAULT_CROP_OPTIONS: CropOptionsSlice = {
	aspectRatioValue: '0',
};

/**
 * The full composite state for the media editor — cropper geometry
 * plus the sidebar control slice. Future feature slices (text
 * overlays, filters, …) extend this object.
 *
 * Every undo/redo snapshot is a full `MediaEditorState`. Slices stay
 * referentially equal across actions that don't touch them.
 */
export interface MediaEditorState {
	cropper: CropperState;
	cropOptions: CropOptionsSlice;
}

/**
 * Composite reducer action union.
 *
 * Cropper geometry actions are wrapped in a `CROPPER` envelope and
 * delegated to the pure `cropperReducer`. Sidebar and history
 * concerns are first-class actions on this reducer.
 */
export type MediaEditorAction =
	/**
	 * Delegate to the underlying cropper reducer. Used for every
	 * geometry transition (pan / zoom / rotation / flip / cropRect /
	 * settle / etc.).
	 */
	| {
			type: 'CROPPER';
			action: CropperAction;
	  }
	/**
	 * Set the aspect-ratio preset. Atomically updates the preset key
	 * and the cropRect (computed from the resolved ratio and the
	 * current visualSize). One transaction = one undo entry.
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
				 * rect. Caller supplies it because the reducer is
				 * framework-agnostic and has no DOM access.
				 */
				visualSize: Size;
			};
	  }
	/** Reset cropOptions to defaults. */
	| { type: 'RESET_CROP_OPTIONS' }
	/**
	 * Replace the entire composite state with `payload`. Used by
	 * undo/redo to restore a full snapshot atomically.
	 */
	| { type: 'RESTORE_SNAPSHOT'; payload: MediaEditorState }
	/**
	 * Adjust the cropper's cropRect in response to a viewport change
	 * (e.g., window resize). Behaviorally identical to a `CROPPER
	 * SET_CROP_RECT` dispatch, but tagged so the hook layer can skip
	 * history recording — viewport reshapes aren't editor actions.
	 */
	| {
			type: 'VIEWPORT_ADJUST_CROP_RECT';
			payload: NormalizedRect;
	  };
