import type { TransformOperation, InternalImageEditorState } from '../types';
import { DEFAULT_STATE } from '../constants';
import { imageEditorReducer } from '../state';

/**
 * Apply a single transform operation to an editor state, returning
 * a new state with the containment invariant enforced.
 *
 * Delegates to the reducer via APPLY_OPERATION so pipeline replay
 * produces identical bounded state to UI interaction or setter
 * calls. The same logical operation yields the same result
 * regardless of entrypoint.
 *
 * @param state The current editor state.
 * @param op    The operation to apply.
 * @return A new editor state with the operation applied.
 */
export function applyOperationToState(
	state: InternalImageEditorState,
	op: TransformOperation
): InternalImageEditorState {
	return imageEditorReducer( state, {
		type: 'APPLY_OPERATION',
		payload: op,
	} );
}

/**
 * Replay all operations from an initial state to produce the final state.
 *
 * @param pipeline     The array of transform operations to replay.
 * @param initialState The starting state. Defaults to DEFAULT_STATE.
 * @return The resulting editor state after all operations are applied.
 */
export function stateFromPipeline(
	pipeline: TransformOperation[],
	initialState: InternalImageEditorState = { ...DEFAULT_STATE }
): InternalImageEditorState {
	return pipeline.reduce(
		( state, op ) => applyOperationToState( state, op ),
		initialState
	);
}
