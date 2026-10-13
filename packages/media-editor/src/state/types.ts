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
 * A value an edit can hold: plain data only, because the session
 * compares values by content to tell a real change from a no-op.
 * Anything else, such as a `Blob`, would compare equal to any other
 * and the change would be dropped — keep bytes behind a URL instead.
 *
 * Objects must satisfy the index signature, so type a value with a
 * `type` alias rather than an `interface`.
 */
export type EditValue =
	| string
	| number
	| boolean
	| null
	| EditValue[]
	| { [ key: string ]: EditValue };

/**
 * Named edits other than crop, keyed by edit name (for example
 * `my-plugin/vignette`). An edit that is not present means "no edit".
 */
export type EditsSlice = Record< string, EditValue >;

/**
 * The full composite state for the media editor — cropper geometry,
 * the sidebar control slice, and named edits.
 *
 * Every undo/redo snapshot is a full `MediaEditorState`. Slices stay
 * referentially equal across actions that don't touch them.
 */
export interface MediaEditorState {
	cropper: CropperState;
	cropOptions: CropOptionsSlice;
	edits: EditsSlice;
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
	/**
	 * Put every slice back to its starting state, keeping the image:
	 * default geometry, default crop options, no edits. One action,
	 * so one undo entry.
	 */
	| { type: 'RESET' }
	/** Set a named edit, or remove it when `value` is `undefined`. */
	| {
			type: 'SET_EDIT';
			payload: { name: string; value: EditValue | undefined };
	  }
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
