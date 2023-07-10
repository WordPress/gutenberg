/**
 * Internal dependencies
 */
import type { State, UndoEdit } from './selectors';

type Optional< T > = T | undefined;
type EntityRecordKey = string | number;

/**
 * Returns the previous edit from the current undo offset
 * for the entity records edits history, if any.
 *
 * @param state State tree.
 *
 * @return The edit.
 */
export function getUndoEdits( state: State ): Optional< UndoEdit[] > {
	return state.undo.list[ state.undo.list.length - 1 + state.undo.offset ];
}

/**
 * Returns the next edit from the current undo offset
 * for the entity records edits history, if any.
 *
 * @param state State tree.
 *
 * @return The edit.
 */
export function getRedoEdits( state: State ): Optional< UndoEdit[] > {
	return state.undo.list[ state.undo.list.length + state.undo.offset ];
}

/**
 * Retrieve the fallback Navigation.
 *
 * @param state Data state.
 * @return The ID for the fallback Navigation post.
 */
export function getNavigationFallbackId(
	state: State
): EntityRecordKey | undefined {
	return state.navigationFallbackId;
}
