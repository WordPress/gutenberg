/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Given an action object, triggers an API request to retrieve the result from
 * the given action path.
 *
 * @param {Object} action Fetch action object.
 *
 * @return {Promise} Fetch promise.
 */
export function FETCH_FROM_API( action ) {
	return apiFetch( { path: action.path } );
}
