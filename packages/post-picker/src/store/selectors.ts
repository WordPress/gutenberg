import type { State } from './types';

/**
 * Returns whether the post picker is open.
 *
 * @param state Store state.
 * @return Whether the post picker is open.
 */
export function isPostPickerOpen( state: State ) {
	return !! state.request;
}

/**
 * Returns the request the post picker is showing, if any.
 *
 * @param state Store state.
 * @return The current request, or `null`.
 */
export function getPostPickerRequest( state: State ) {
	return state.request;
}
