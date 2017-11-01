/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import { getCurrentPost, hasEditorUndo } from '../selectors';

/**
 * Action creator returning an action object used in signalling that the post's
 * dirty saved state should be toggled.
 *
 * @param  {Boolean} isDirty Whether post is dirty
 * @return {Object}          Action object
 */
export function toggleDirty( isDirty ) {
	return {
		type: 'TOGGLE_DIRTY',
		isDirty,
	};
}

/**
 * Redux middleware for save state dirtying tracking.
 *
 * @param  {Function} store Redux store object
 * @return {Function}       Middleware function
 */
export const middleware = ( store ) => ( next ) => ( action ) => {
	const state = store.getState();
	const result = next( action );
	const nextState = store.getState();

	let isDirty;
	if ( getCurrentPost( nextState ) !== getCurrentPost( state ) ) {
		// Current post reflects last known post save, so if these references
		// differ, we can assume that the post has been saved
		isDirty = false;
	} else if ( state.editor !== nextState.editor && hasEditorUndo( nextState ) ) {
		// Editor state tracks post attribute edits, block order, block
		// attributes. If any of these change, assume the post is dirtied.
		// Without undo indicates an editor history reset (initial load).
		isDirty = true;
	}

	// Avoid dispatch except when we know that the state is changing
	if ( undefined !== isDirty && isDirty !== nextState.saveState.isDirty ) {
		store.dispatch( toggleDirty( isDirty ) );
	}

	return result;
};

export default combineReducers( {
	/**
	 * Reducer reflecting whether the post is considered dirty (needing save).
	 *
	 * @param  {Boolean} state  Original state
	 * @param  {Object}  action Action object
	 * @return {Boolean}        Next state
	 */
	isDirty( state = false, action ) {
		switch ( action.type ) {
			case 'TOGGLE_DIRTY':
				return action.isDirty;
		}

		return state;
	},
} );
