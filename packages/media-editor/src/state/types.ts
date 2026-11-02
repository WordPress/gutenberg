import type {
	CropSessionAction,
	CropSessionState,
} from '@wordpress/image-cropper';

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
 * The full state of the media editor: the crop session (cropper
 * geometry and crop options) plus named edits.
 *
 * Every undo/redo snapshot is a full `MediaEditorState`. Slices stay
 * referentially equal across actions that don't touch them.
 */
export interface MediaEditorState extends CropSessionState {
	edits: EditsSlice;
}

/**
 * The media editor's own action. Everything else is a crop session
 * action, handled by `cropSessionReducer` from `@wordpress/image-cropper`.
 */
export type MediaEditAction = {
	/** Set a named edit, or remove it when `value` is `undefined`. */
	type: 'SET_EDIT';
	payload: { name: string; value: EditValue | undefined };
};

/** Every action the media editor reducer handles. */
export type MediaEditorAction =
	MediaEditAction | CropSessionAction< MediaEditorState >;
