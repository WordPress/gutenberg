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
