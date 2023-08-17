/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Sets up the `apiFetch` library for testing by mocking request responses.
 *
 * Example:
 *
 * const responses = [
 *     {
 *         request: {
 *             path: `/wp/v2/media/1?context=edit`,
 *         },
 *         response: {
 *             source_url: 'https://image-1.jpg',
 *             id: 1,
 *         },
 *     },
 *     {
 *         request: {
 *             path: `/wp/v2/media/2?context=edit`,
 *         },
 *         response: {
 *             source_url: 'https://image-2.jpg',
 *             id: 2,
 *         },
 *     },
 * ];
 * setupApiFetch( responses );
 * ...
 * expect( apiFetch ).toHaveBeenCalledWith( responses[1].request );
 *
 * @param {object[]} responses Array with the potential responses to return upon requests.
 */
export function setupApiFetch( responses ) {
	apiFetch.mockImplementation( async ( options ) => {
		const matchedResponse = responses.find(
			( { request: { path, method } } ) => {
				return (
					path === options.path &&
					( ! options.method || method === options.method )
				);
			}
		);
		return matchedResponse?.response;
	} );
}
