/**
 * Returns the filter' field to open on mount.
 *
 * @param {Object} state Global application state.
 * @return {string|null} The filter's field that should open on mount.
 */
export function getOpenFilterOnMount( state ) {
	return state.openFilterOnMount;
}
