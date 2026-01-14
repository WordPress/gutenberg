/**
 * Selectors for UI-only state.
 * Guidelines data is accessed via core-data's useEntityRecord hook.
 */

/**
 * Get error.
 *
 * @param {Object} state Store state.
 * @return {string|null} Error message.
 */
export function getError( state ) {
	return state.error;
}

/**
 * Get revisions list.
 *
 * @param {Object} state Store state.
 * @return {Array} Revisions.
 */
export function getRevisions( state ) {
	return state.revisions;
}

/**
 * Check if restoring.
 *
 * @param {Object} state Store state.
 * @return {boolean} Whether restoring.
 */
export function isRestoring( state ) {
	return state.isRestoring;
}

/**
 * Get test results.
 *
 * @param {Object} state Store state.
 * @return {Object|null} Test results.
 */
export function getTestResults( state ) {
	return state.testResults;
}

/**
 * Check if running test.
 *
 * @param {Object} state Store state.
 * @return {boolean} Whether running test.
 */
export function isRunningTest( state ) {
	return state.isRunningTest;
}
