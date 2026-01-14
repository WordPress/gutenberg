/**
 * Get active guidelines.
 *
 * @param {Object} state Store state.
 * @return {Object|null} Active guidelines.
 */
export function getActive( state ) {
	return state.active;
}

/**
 * Get draft guidelines.
 *
 * @param {Object} state Store state.
 * @return {Object|null} Draft guidelines.
 */
export function getDraft( state ) {
	return state.draft;
}

/**
 * Check if draft exists.
 *
 * @param {Object} state Store state.
 * @return {boolean} Whether draft exists.
 */
export function hasDraft( state ) {
	return state.draft !== null;
}

/**
 * Alias for hasDraft - for consistent getter naming.
 *
 * @param {Object} state Store state.
 * @return {boolean} Whether draft exists.
 */
export function getHasDraft( state ) {
	return hasDraft( state );
}

/**
 * Get the current guidelines to edit (draft or active).
 *
 * @param {Object} state Store state.
 * @return {Object|null} Current guidelines.
 */
export function getCurrentGuidelines( state ) {
	return state.draft || state.active;
}

/**
 * Get post ID.
 *
 * @param {Object} state Store state.
 * @return {number|null} Post ID.
 */
export function getPostId( state ) {
	return state.postId;
}

/**
 * Get updated at timestamp.
 *
 * @param {Object} state Store state.
 * @return {string|null} Updated at.
 */
export function getUpdatedAt( state ) {
	return state.updatedAt;
}

/**
 * Get revision count.
 *
 * @param {Object} state Store state.
 * @return {number} Revision count.
 */
export function getRevisionCount( state ) {
	return state.revisionCount;
}

/**
 * Check if saving.
 *
 * @param {Object} state Store state.
 * @return {boolean} Whether saving.
 */
export function isSaving( state ) {
	return state.isSaving;
}

/**
 * Check if publishing.
 *
 * @param {Object} state Store state.
 * @return {boolean} Whether publishing.
 */
export function isPublishing( state ) {
	return state.isPublishing;
}

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

/**
 * Check if guidelines exist (either active or draft).
 *
 * @param {Object} state Store state.
 * @return {boolean} Whether guidelines exist.
 */
export function hasGuidelines( state ) {
	return state.active !== null || state.draft !== null;
}

/**
 * Check if draft has changes from active.
 *
 * @param {Object} state Store state.
 * @return {boolean} Whether draft differs from active.
 */
export function draftHasChanges( state ) {
	if ( ! state.draft ) {
		return false;
	}

	if ( ! state.active ) {
		return true;
	}

	// Simple JSON comparison.
	return JSON.stringify( state.draft ) !== JSON.stringify( state.active );
}

/**
 * Get a specific section from current guidelines.
 *
 * @param {Object} state   Store state.
 * @param {string} section Section name.
 * @return {Object|null} Section data.
 */
export function getSection( state, section ) {
	const current = state.draft || state.active;
	return current ? current[ section ] : null;
}

/**
 * Get brand context section.
 *
 * @param {Object} state Store state.
 * @return {Object|null} Brand context.
 */
export function getBrandContext( state ) {
	return getSection( state, 'brand_context' );
}

/**
 * Get voice & tone section.
 *
 * @param {Object} state Store state.
 * @return {Object|null} Voice & tone.
 */
export function getVoiceTone( state ) {
	return getSection( state, 'voice_tone' );
}

/**
 * Get copy rules section.
 *
 * @param {Object} state Store state.
 * @return {Object|null} Copy rules.
 */
export function getCopyRules( state ) {
	return getSection( state, 'copy_rules' );
}

/**
 * Get vocabulary section.
 *
 * @param {Object} state Store state.
 * @return {Object|null} Vocabulary.
 */
export function getVocabulary( state ) {
	return getSection( state, 'vocabulary' );
}

/**
 * Get image style section.
 *
 * @param {Object} state Store state.
 * @return {Object|null} Image style.
 */
export function getImageStyle( state ) {
	return getSection( state, 'image_style' );
}

/**
 * Get notes.
 *
 * @param {Object} state Store state.
 * @return {string|null} Notes.
 */
export function getNotes( state ) {
	const current = state.draft || state.active;
	return current ? current.notes : null;
}
