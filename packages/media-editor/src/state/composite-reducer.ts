import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import {
	cropSessionReducer,
	areCropSessionStatesEqual,
	buildInitialCropSessionState,
	type CropGeometry,
} from '@wordpress/image-cropper';
import type { MediaEditorAction, MediaEditorState } from './types';

/**
 * Pure reducer for the media editor.
 *
 * Owns the named edits and passes every other action to the crop
 * session reducer from `@wordpress/image-cropper`. `RESET` also clears
 * the edits, so it stays one undo entry.
 *
 * This reducer keeps no history; `useCropSession` does.
 *
 * @param state  Current state.
 * @param action Action to apply.
 * @return Next state.
 */
export function mediaEditorReducer(
	state: MediaEditorState,
	action: MediaEditorAction
): MediaEditorState {
	switch ( action.type ) {
		case 'SET_EDIT': {
			const { name, value } = action.payload;
			if ( value === undefined ) {
				if ( ! Object.hasOwn( state.edits, name ) ) {
					return state;
				}
				const edits = { ...state.edits };
				delete edits[ name ];
				return { ...state, edits };
			}
			if ( fastDeepEqual( state.edits[ name ], value ) ) {
				return state;
			}
			return { ...state, edits: { ...state.edits, [ name ]: value } };
		}
		case 'RESET': {
			const next = cropSessionReducer( state, action );
			if ( Object.keys( state.edits ).length === 0 ) {
				return next;
			}
			return { ...next, edits: {} };
		}
		default:
			return cropSessionReducer( state, action );
	}
}

/**
 * Value-equality check for two media editor states. The history uses it
 * to skip snapshots when an action turned out to be a no-op.
 *
 * @param a First state.
 * @param b Second state.
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
		areCropSessionStatesEqual( a, b ) && fastDeepEqual( a.edits, b.edits )
	);
}

/**
 * Build the state a session starts from: the given geometry, default
 * crop options, and no edits.
 *
 * @param cropper The cropper geometry.
 * @return Initial state.
 */
export function buildInitialMediaEditorState(
	cropper: CropGeometry
): MediaEditorState {
	return { ...buildInitialCropSessionState( cropper ), edits: {} };
}
