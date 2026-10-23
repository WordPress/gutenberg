import type { State } from './types';

/**
 * Returns true if pattern is in the editing state.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId the clientID of the block.
 * @return {boolean} Whether the pattern is in the editing state.
 */
export function isEditingPattern(
	state: State,
	clientId: string
): boolean | undefined {
	return state.isEditingPattern[ clientId ];
}
