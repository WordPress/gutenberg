import type { CropGeometry } from '../core';
import {
	cropperReducer,
	areCropperStatesEqual,
	computeInscribedRect,
} from '../core';
import {
	DEFAULT_CROP_OPTIONS,
	type CropSessionAction,
	type CropSessionState,
} from './types';

/**
 * Pure reducer for a crop session.
 *
 * Delegates `CROPPER` actions to `cropperReducer` and owns the crop
 * options. Slices it does not know about are kept as they are, so a
 * wider session state can delegate to it. `RESTORE_SNAPSHOT` replaces
 * the whole state (used by undo/redo).
 *
 * This reducer keeps no history; `useCropSession` does.
 *
 * @param state  Current state.
 * @param action Action to apply.
 * @return Next state.
 */
export function cropSessionReducer< S extends CropSessionState >(
	state: S,
	action: CropSessionAction< S >
): S {
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
			// Update the preset key and reshape the cropRect together
			// (when the ratio is fixed and there is a visualSize), so it
			// is one undo entry.
			const shouldReshape =
				resolved !== undefined &&
				resolved > 0 &&
				visualSize.width > 0 &&
				visualSize.height > 0;
			const nextCropOptions = {
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
				...state,
				cropper: nextCropper,
				cropOptions: nextCropOptions,
			};
		}
		case 'RESET': {
			const next = {
				...state,
				cropper: cropperReducer( state.cropper, { type: 'RESET' } ),
				cropOptions: { ...DEFAULT_CROP_OPTIONS },
			};
			return areCropSessionStatesEqual( state, next ) ? state : next;
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
	return state;
}

/**
 * Value-equality check for the crop session slices. The history uses it
 * to skip snapshots when an action turned out to be a no-op.
 *
 * @param a First state.
 * @param b Second state.
 * @return Whether the geometry and crop options of `a` and `b` are equal.
 */
export function areCropSessionStatesEqual(
	a: CropSessionState,
	b: CropSessionState
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
 * Build the state a session starts from: the given geometry and default
 * crop options.
 *
 * @param cropper The cropper geometry.
 * @return Initial state.
 */
export function buildInitialCropSessionState(
	cropper: CropGeometry
): CropSessionState {
	return {
		cropper,
		cropOptions: { ...DEFAULT_CROP_OPTIONS },
	};
}
