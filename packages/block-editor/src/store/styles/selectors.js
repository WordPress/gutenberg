/**
 * Returns all style overrides, intended to be merged with global editor styles.
 *
 * @param {Object} state Global application state.
 *
 * @return {Map} A map of style IDs to style overrides.
 */
export function getStyleOverrides( state ) {
	return state.styleOverrides;
}
