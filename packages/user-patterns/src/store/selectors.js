/**
 * Returns true if reusable block is in the editing state.
 *
 * @param {Object} state    Global application state.
 * @param {number} clientId the clientID of the block.
 * @return {boolean} Whether the reusable block is in the editing state.
 */
export function __experimentalIsEditingPatterns( state, clientId ) {
	return state.isEditingPatterns[ clientId ];
}
