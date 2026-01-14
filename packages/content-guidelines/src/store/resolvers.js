/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { setGuidelines, setRevisions, setError } from './actions';

/**
 * Resolver for getActive.
 * Fetches guidelines from the API.
 *
 * @return {Function} Thunk action.
 */
export function getActive() {
	return async ( { dispatch } ) => {
		try {
			const data = await apiFetch( {
				path: '/wp/v2/content-guidelines',
			} );

			dispatch( setGuidelines( data ) );
		} catch ( error ) {
			dispatch( setError( error.message || 'Failed to fetch guidelines.' ) );
		}
	};
}

/**
 * Resolver for getDraft.
 * Uses the same fetch as getActive.
 *
 * @return {Function} Thunk action.
 */
export function getDraft() {
	return getActive();
}

/**
 * Resolver for getCurrentGuidelines.
 * Uses the same fetch as getActive.
 *
 * @return {Function} Thunk action.
 */
export function getCurrentGuidelines() {
	return getActive();
}

/**
 * Resolver for hasGuidelines.
 * Uses the same fetch as getActive.
 *
 * @return {Function} Thunk action.
 */
export function hasGuidelines() {
	return getActive();
}

/**
 * Resolver for getRevisions.
 * Fetches revision history from the API.
 *
 * @return {Function} Thunk action.
 */
export function getRevisions() {
	return async ( { dispatch } ) => {
		try {
			const revisions = await apiFetch( {
				path: '/wp/v2/content-guidelines/revisions',
			} );

			dispatch( setRevisions( revisions ) );
		} catch ( error ) {
			// Silently fail for revisions - not critical.
		}
	};
}
