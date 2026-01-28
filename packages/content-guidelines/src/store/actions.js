/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { dispatch as dataDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Action types.
 * Only UI-only state is managed here.
 * Guidelines data is managed by core-data.
 */
export const SET_ERROR = 'SET_ERROR';
export const SET_REVISIONS = 'SET_REVISIONS';
export const SET_RESTORING = 'SET_RESTORING';
export const SET_TEST_RESULTS = 'SET_TEST_RESULTS';
export const SET_RUNNING_TEST = 'SET_RUNNING_TEST';

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

			// Refresh revisions.
			await dispatch.fetchRevisions();

			// Invalidate guidelines entity so core-data refetches fresh data.
			dataDispatch( coreStore ).invalidateResolution( 'getEntityRecord', [
				'root',
				'contentGuidelines',
				'current',
			] );
			dataDispatch( coreStore ).invalidateResolution(
				'getEditedEntityRecord',
				[ 'root', 'contentGuidelines', 'current' ]
			);
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
