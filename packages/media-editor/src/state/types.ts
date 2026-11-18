import type { ImageEditorState } from '@wordpress/image-editor';

/**
 * Sidebar control state for the image editor, kept in the same undo history
 * as the crop.
 */
export interface CropOptionsSlice {
	/**
	 * Selected aspect-ratio preset as a string (round-trippable through
	 * `<SelectControl>`). `'0'` = Free, `'-1'` = Original, any positive
	 * decimal = fixed ratio. The image editor holds the resolved ratio itself.
	 */
	aspectRatioValue: string;
}

/**
 * The crop options a session starts from.
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
 * The full state of the media editor: the image editor's state, the sidebar
 * crop options and named edits.
 *
 * Every undo/redo snapshot is a full `MediaEditorState`. Slices stay
 * referentially equal across actions that don't touch them.
 */
export interface MediaEditorState {
	imageEditor: ImageEditorState;
	cropOptions: CropOptionsSlice;
	edits: EditsSlice;
}

/** Actions the media editor reducer handles. */
export type MediaEditorAction =
	/** Replace the image editor's state with the next one it reports. */
	| { type: 'SET_IMAGE_EDITOR'; payload: ImageEditorState }
	/** Set the aspect-ratio preset the dropdown shows. */
	| { type: 'SET_ASPECT_RATIO_VALUE'; payload: string }
	/** Set a named edit, or remove it when `value` is `undefined`. */
	| {
			type: 'SET_EDIT';
			payload: { name: string; value: EditValue | undefined };
	  }
	/**
	 * Put every slice back to its starting state, keeping the image. One
	 * action, so one undo entry.
	 */
	| { type: 'RESET' }
	/** Replace the whole state with a snapshot (undo/redo). */
	| { type: 'RESTORE_SNAPSHOT'; payload: MediaEditorState };
