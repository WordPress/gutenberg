/**
 * Returns true if pattern is in the editing state.
 *
 * @param {Object} state    Global application state.
 * @param {number} clientId the clientID of the block.
 * @return {boolean} Whether the pattern is in the editing state.
 */
export function isEditingPattern( state, clientId ) {
	return state.isEditingPattern[ clientId ];
}

/**
 * Retrieve the list of registered block pattern categories.
 *
 * @param {Object} state Data state.
 * @return {Array} Block pattern category list.
 */
export function getPatternCategories( state ) {
	return state.patternCategories;
}
