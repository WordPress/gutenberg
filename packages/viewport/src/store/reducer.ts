/**
 * Internal dependencies
 */
import type { ViewportAction, ViewportState } from '../types';

/**
 * Reducer returning the viewport state, as keys of breakpoint queries with
 * boolean value representing whether query is matched.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
function reducer(
	state: ViewportState = {},
	action: ViewportAction
): ViewportState {
	switch ( action.type ) {
		case 'SET_IS_MATCHING':
			return action.values;
	}

	return state;
}

export default reducer;
