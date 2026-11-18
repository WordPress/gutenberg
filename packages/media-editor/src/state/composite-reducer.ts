import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import {
	areImageEditorStatesEqual,
	createImageEditorState,
	type ImageEditorState,
} from '@wordpress/image-editor';
import {
	DEFAULT_CROP_OPTIONS,
	type MediaEditorAction,
	type MediaEditorState,
} from './types';

/**
 * Pure reducer for the media editor.
 *
 * The image editor works out its own next state (through the controller from
 * `@wordpress/image-editor`) and this reducer stores it. The reducer
 * also owns the sidebar crop options and the named edits.
 *
 * This reducer keeps no history; `useMediaEditorState` does.
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
		case 'SET_IMAGE_EDITOR':
			return action.payload === state.imageEditor
				? state
				: { ...state, imageEditor: action.payload };
		case 'SET_ASPECT_RATIO_VALUE':
			return state.cropOptions.aspectRatioValue === action.payload
				? state
				: {
						...state,
						cropOptions: {
							...state.cropOptions,
							aspectRatioValue: action.payload,
						},
					};
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
			const next = buildInitialMediaEditorState(
				createImageEditorState( { image: state.imageEditor.image } )
			);
			return areMediaEditorStatesEqual( state, next ) ? state : next;
		}
		case 'RESTORE_SNAPSHOT':
			return action.payload;
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
		areImageEditorStatesEqual( a.imageEditor, b.imageEditor ) &&
		a.cropOptions.aspectRatioValue === b.cropOptions.aspectRatioValue &&
		fastDeepEqual( a.edits, b.edits )
	);
}

/**
 * Build the state a session starts from: the given image editor state,
 * default crop options, and no edits.
 *
 * @param imageEditor The image editor state.
 * @return Initial state.
 */
export function buildInitialMediaEditorState(
	imageEditor: ImageEditorState
): MediaEditorState {
	return {
		imageEditor,
		cropOptions: { ...DEFAULT_CROP_OPTIONS },
		edits: {},
	};
}
