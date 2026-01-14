/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { setRevisions } from './actions';

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
