/**
 * Internal dependencies
 */
import {
	cropperReducer,
	areCropperStatesEqual,
	computeInscribedRect,
	type CropperState,
} from '../image-editor';
import {
	DEFAULT_CROP_OPTIONS,
	type CropOptionsSlice,
	type MediaEditorAction,
	type MediaEditorState,
} from './types';

/**
 * Pure composite reducer for the media editor.
 *
 * Delegates `CROPPER`-tagged actions to the framework-agnostic
 * `cropperReducer` and owns first-class transitions for the sidebar
 * `cropOptions` slice. `RESTORE_SNAPSHOT` replaces the whole composite
 * in one transaction (used by undo/redo).
 *
 * Note: this reducer carries NO history of its own. Snapshots and
 * stacks live in the `useMediaEditorState` hook that wraps it.
 *
 * @param state  Current composite state.
 * @param action Action to apply.
 * @return Next composite state.
 */
export function mediaEditorReducer(
	state: MediaEditorState,
	action: MediaEditorAction
): MediaEditorState {
	switch ( action.type ) {
		case 'CROPPER': {
			const nextCropper = cropperReducer( state.cropper, action.action );
			if ( nextCropper === state.cropper ) {
				return state;
			}
			return { ...state, cropper: nextCropper };
		}
		case 'SET_ASPECT_RATIO_VALUE': {
			const { presetKey, resolved, visualSize } = action.payload;
			// Atomically: update the preset key AND reshape the
			// cropRect (when the ratio is non-Free and we have a
			// visualSize). One transaction = one undo entry.
			const shouldReshape =
				resolved !== undefined &&
				resolved > 0 &&
				visualSize.width > 0 &&
				visualSize.height > 0;
			const nextCropOptions: CropOptionsSlice = {
				...state.cropOptions,
				aspectRatioValue: presetKey,
			};
			if ( ! shouldReshape ) {
				if ( state.cropOptions.aspectRatioValue === presetKey ) {
					return state;
				}
				return { ...state, cropOptions: nextCropOptions };
			}
			const newCropRect = computeInscribedRect( resolved, visualSize );
			const nextCropper = cropperReducer( state.cropper, {
				type: 'SET_CROP_RECT',
				payload: newCropRect,
			} );
			return {
				cropper: nextCropper,
				cropOptions: nextCropOptions,
			};
		}
		case 'RESET_CROP_OPTIONS': {
			if (
				state.cropOptions.aspectRatioValue ===
				DEFAULT_CROP_OPTIONS.aspectRatioValue
			) {
				return state;
			}
			return {
				...state,
				cropOptions: { ...DEFAULT_CROP_OPTIONS },
			};
		}
		case 'RESTORE_SNAPSHOT':
			return action.payload;
		case 'VIEWPORT_ADJUST_CROP_RECT': {
			const nextCropper = cropperReducer( state.cropper, {
				type: 'SET_CROP_RECT',
				payload: action.payload,
			} );
			if ( nextCropper === state.cropper ) {
				return state;
			}
			return { ...state, cropper: nextCropper };
		}
	}
}

/**
 * Value-equality check for two composite states. Used by the history
 * machinery to dedup snapshots when an action turned out to be a no-op.
 *
 * @param a First composite state.
 * @param b Second composite state.
 * @return Whether `a` and `b` are value-equal across all slices.
 */
export function areMediaEditorStatesEqual(
	a: MediaEditorState,
	b: MediaEditorState
): boolean {
	if ( a === b ) {
		return true;
	}
	return (
		areCropperStatesEqual( a.cropper, b.cropper ) &&
		a.cropOptions.aspectRatioValue === b.cropOptions.aspectRatioValue
	);
}

/**
 * Build the initial composite state from optional partial overrides.
 *
 * @param initialCropper Initial cropper-slice fields to merge.
 * @param initialOptions Initial cropOptions-slice fields to merge.
 * @return Composite initial state.
 */
export function buildInitialMediaEditorState(
	initialCropper: CropperState,
	initialOptions?: Partial< CropOptionsSlice >
): MediaEditorState {
	return {
		cropper: initialCropper,
		cropOptions: { ...DEFAULT_CROP_OPTIONS, ...initialOptions },
	};
}
