import { useCallback, useMemo } from '@wordpress/element';
import { useCropSession, type CropSession } from '@wordpress/image-cropper';
import {
	mediaEditorReducer,
	areMediaEditorStatesEqual,
	buildInitialMediaEditorState,
} from './composite-reducer';
import type {
	EditsSlice,
	EditValue,
	MediaEditAction,
	MediaEditorState,
} from './types';

const SESSION_OPTIONS = {
	reducer: mediaEditorReducer,
	areStatesEqual: areMediaEditorStatesEqual,
	createInitialState: buildInitialMediaEditorState,
};

/**
 * The media editor session exposed by `useMediaEditorState`.
 *
 * A crop session from `@wordpress/image-cropper` (the image, cropper
 * geometry, crop options, the shared undo/redo history and gesture
 * boundaries) plus named edits and whether the edits change the saved
 * image.
 */
export interface MediaEditorSession extends Omit<
	CropSession< MediaEditorState, MediaEditAction >,
	'state' | 'dispatch'
> {
	/** The named edits other than crop, keyed by edit name. */
	edits: EditsSlice;
	/**
	 * Set a named edit, or remove it by passing `undefined`. Recorded
	 * in the session history like any crop change. Setting a value
	 * equal in content to the current one is a no-op.
	 */
	setEdit: ( name: string, value: EditValue | undefined ) => void;
	/**
	 * Whether the edits change the saved image, so saving has to
	 * produce new image output rather than only metadata.
	 */
	hasOutputEdits: boolean;
}

/**
 * The media editor session: a crop session whose undo history also
 * covers named edits. `isDirty` tracks the whole session, including
 * state that does not change the image; use `hasOutputEdits` to decide
 * whether the image output needs saving.
 *
 * The session starts empty. Call `setSourceImage` to load an image.
 *
 * @return The media editor session.
 */
export function useMediaEditorState(): MediaEditorSession {
	const {
		state,
		dispatch,
		cropper,
		cropOptions,
		setAspectRatioValue,
		reset,
		setSourceImage,
		isDirty,
		hasUndo,
		hasRedo,
		undo,
		redo,
		beginGesture,
		endGesture,
	} = useCropSession< MediaEditorState, MediaEditAction >( SESSION_OPTIONS );

	const setEdit = useCallback(
		( name: string, value: EditValue | undefined ) => {
			dispatch( { type: 'SET_EDIT', payload: { name, value } } );
		},
		[ dispatch ]
	);

	return useMemo(
		() => ( {
			cropper,
			cropOptions,
			setAspectRatioValue,
			edits: state.edits,
			setEdit,
			setSourceImage,
			reset,
			isDirty,
			// Only geometry changes the saved image so far.
			hasOutputEdits: cropper.isDirty,
			hasUndo,
			hasRedo,
			undo,
			redo,
			beginGesture,
			endGesture,
		} ),
		[
			cropper,
			cropOptions,
			setAspectRatioValue,
			state.edits,
			setEdit,
			setSourceImage,
			reset,
			isDirty,
			hasUndo,
			hasRedo,
			undo,
			redo,
			beginGesture,
			endGesture,
		]
	);
}
