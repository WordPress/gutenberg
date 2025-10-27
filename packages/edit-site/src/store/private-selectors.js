/**
 * Returns the current path in the global styles navigation.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Current styles navigation path.
 */
export function getStylesPath( state ) {
	return state.stylesNavigation.path;
}

/**
 * Returns whether the stylebook preview is visible.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the stylebook is visible.
 */
export function getShowStylebook( state ) {
	return state.stylesNavigation.showStylebook;
}

export function getRoutes( state ) {
	return state.routes;
}
