/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Action types.
 */
export const SET_GUIDELINES = 'SET_GUIDELINES';
export const SET_DRAFT = 'SET_DRAFT';
export const SET_SAVING = 'SET_SAVING';
export const SET_PUBLISHING = 'SET_PUBLISHING';
export const SET_ERROR = 'SET_ERROR';
export const SET_REVISIONS = 'SET_REVISIONS';
export const SET_RESTORING = 'SET_RESTORING';
export const SET_TEST_RESULTS = 'SET_TEST_RESULTS';
export const SET_RUNNING_TEST = 'SET_RUNNING_TEST';

/**
 * Set guidelines data.
 *
 * @param {Object} data Guidelines data.
 * @return {Object} Action object.
 */
export function setGuidelines( data ) {
	return {
		type: SET_GUIDELINES,
		payload: data,
	};
}

/**
 * Set draft guidelines.
 *
 * @param {Object} draft Draft data.
 * @return {Object} Action object.
 */
export function setDraft( draft ) {
	return {
		type: SET_DRAFT,
		payload: draft,
	};
}

/**
 * Set saving state.
 *
 * @param {boolean} isSaving Whether saving.
 * @return {Object} Action object.
 */
export function setSaving( isSaving ) {
	return {
		type: SET_SAVING,
		payload: isSaving,
	};
}

/**
 * Set publishing state.
 *
 * @param {boolean} isPublishing Whether publishing.
 * @return {Object} Action object.
 */
export function setPublishing( isPublishing ) {
	return {
		type: SET_PUBLISHING,
		payload: isPublishing,
	};
}

/**
 * Set error.
 *
 * @param {string|null} error Error message.
 * @return {Object} Action object.
 */
export function setError( error ) {
	return {
		type: SET_ERROR,
		payload: error,
	};
}

/**
 * Set revisions.
 *
 * @param {Array} revisions Revisions list.
 * @return {Object} Action object.
 */
export function setRevisions( revisions ) {
	return {
		type: SET_REVISIONS,
		payload: revisions,
	};
}

/**
 * Set restoring state.
 *
 * @param {boolean} isRestoring Whether restoring.
 * @return {Object} Action object.
 */
export function setRestoring( isRestoring ) {
	return {
		type: SET_RESTORING,
		payload: isRestoring,
	};
}

/**
 * Set test results.
 *
 * @param {Object} results Test results.
 * @return {Object} Action object.
 */
export function setTestResults( results ) {
	return {
		type: SET_TEST_RESULTS,
		payload: results,
	};
}

/**
 * Set running test state.
 *
 * @param {boolean} isRunning Whether running.
 * @return {Object} Action object.
 */
export function setRunningTest( isRunning ) {
	return {
		type: SET_RUNNING_TEST,
		payload: isRunning,
	};
}

/**
 * Update draft and optionally save to server.
 *
 * @param {Object}  updates     Updates to apply.
 * @param {boolean} saveToServer Whether to save to server.
 * @return {Function} Thunk action.
 */
export function updateDraft( updates, saveToServer = false ) {
	return async ( { dispatch, select } ) => {
		const currentDraft = select.getDraft() || select.getActive() || {};
		const newDraft = {
			...currentDraft,
			...updates,
		};

		dispatch.setDraft( newDraft );

		if ( saveToServer ) {
			await dispatch.saveDraft();
		}
	};
}

/**
 * Deep merge for nested objects.
 *
 * @param {Object} updates Section updates.
 * @param {string} section Section name.
 * @return {Function} Thunk action.
 */
export function updateDraftSection( section, updates ) {
	return async ( { dispatch, select } ) => {
		const currentDraft = select.getDraft() || select.getActive() || {};
		const currentSection = currentDraft[ section ] || {};

		const newDraft = {
			...currentDraft,
			[ section ]: {
				...currentSection,
				...updates,
			},
		};

		dispatch.setDraft( newDraft );
	};
}

/**
 * Save draft to server.
 *
 * @return {Function} Thunk action.
 */
export function saveDraft() {
	return async ( { dispatch, select } ) => {
		const draft = select.getDraft();

		if ( ! draft ) {
			return;
		}

		dispatch.setSaving( true );
		dispatch.setError( null );

		try {
			await apiFetch( {
				path: '/wp/v2/content-guidelines/draft',
				method: 'PUT',
				data: { guidelines: draft },
			} );
		} catch ( error ) {
			dispatch.setError( error.message || 'Failed to save draft.' );
		} finally {
			dispatch.setSaving( false );
		}
	};
}

/**
 * Publish draft.
 *
 * @return {Function} Thunk action.
 */
export function publishDraft() {
	return async ( { dispatch, select } ) => {
		const draft = select.getDraft();

		if ( ! draft ) {
			return;
		}

		dispatch.setPublishing( true );
		dispatch.setError( null );

		try {
			// First save the draft.
			await apiFetch( {
				path: '/wp/v2/content-guidelines/draft',
				method: 'PUT',
				data: { guidelines: draft },
			} );

			// Then publish.
			await apiFetch( {
				path: '/wp/v2/content-guidelines/publish',
				method: 'POST',
			} );

			// Refresh guidelines.
			const data = await apiFetch( {
				path: '/wp/v2/content-guidelines',
			} );

			dispatch.setGuidelines( data );
			dispatch.setDraft( null );
		} catch ( error ) {
			dispatch.setError( error.message || 'Failed to publish.' );
		} finally {
			dispatch.setPublishing( false );
		}
	};
}

/**
 * Discard draft.
 *
 * @return {Function} Thunk action.
 */
export function discardDraft() {
	return async ( { dispatch, select } ) => {
		dispatch.setError( null );

		try {
			await apiFetch( {
				path: '/wp/v2/content-guidelines/discard-draft',
				method: 'POST',
			} );

			// Reset draft to active guidelines
			const active = select.getActive();
			if ( active ) {
				dispatch.setDraft( { ...active } );
			} else {
				dispatch.setDraft( null );
			}
		} catch ( error ) {
			dispatch.setError( error.message || 'Failed to discard draft.' );
		}
	};
}

/**
 * Fetch revisions.
 *
 * @return {Function} Thunk action.
 */
export function fetchRevisions() {
	return async ( { dispatch } ) => {
		try {
			const revisions = await apiFetch( {
				path: '/wp/v2/content-guidelines/revisions',
			} );

			dispatch.setRevisions( revisions );
		} catch ( error ) {
			// Silently fail for revisions.
		}
	};
}

/**
 * Restore a revision.
 *
 * @param {number} revisionId Revision ID.
 * @return {Function} Thunk action.
 */
export function restoreRevision( revisionId ) {
	return async ( { dispatch } ) => {
		dispatch.setRestoring( true );
		dispatch.setError( null );

		try {
			await apiFetch( {
				path: `/wp/v2/content-guidelines/restore/${ revisionId }`,
				method: 'POST',
			} );

			// Refresh guidelines.
			const data = await apiFetch( {
				path: '/wp/v2/content-guidelines',
			} );

			dispatch.setGuidelines( data );

			// Refresh revisions.
			await dispatch.fetchRevisions();
		} catch ( error ) {
			dispatch.setError( error.message || 'Failed to restore revision.' );
		} finally {
			dispatch.setRestoring( false );
		}
	};
}

/**
 * Run playground test.
 *
 * @param {Object} options Test options.
 * @return {Function} Thunk action.
 */
export function runPlaygroundTest( options ) {
	return async ( { dispatch } ) => {
		dispatch.setRunningTest( true );
		dispatch.setTestResults( null );
		dispatch.setError( null );

		try {
			const results = await apiFetch( {
				path: '/wp/v2/content-guidelines/test',
				method: 'POST',
				data: options,
			} );

			dispatch.setTestResults( results );
		} catch ( error ) {
			dispatch.setError( error.message || 'Failed to run test.' );
		} finally {
			dispatch.setRunningTest( false );
		}
	};
}

/**
 * Initialize editor with draft from active.
 *
 * @return {Function} Thunk action.
 */
export function initializeEditor() {
	return async ( { dispatch, select } ) => {
		const hasDraft = select.hasDraft();

		if ( ! hasDraft ) {
			const active = select.getActive();
			if ( active ) {
				dispatch.setDraft( { ...active } );
			}
		}
	};
}

/**
 * Update block-specific guidelines.
 *
 * @param {string} blockName  Block name (e.g., 'core/paragraph').
 * @param {Object} guidelines Guidelines for this block.
 * @return {Function} Thunk action.
 */
export function updateBlockGuidelines( blockName, guidelines ) {
	return async ( { dispatch, select } ) => {
		const currentDraft = select.getDraft() || select.getActive() || {};
		const currentBlocks = currentDraft.blocks || {};

		const newDraft = {
			...currentDraft,
			blocks: {
				...currentBlocks,
				[ blockName ]: guidelines,
			},
		};

		dispatch.setDraft( newDraft );
	};
}

/**
 * Alias for publishDraft.
 *
 * @return {Function} Thunk action.
 */
export function publishGuidelines() {
	return publishDraft();
}
