/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Default batch processor. Sends its input requests to /v1/batch.
 *
 * @param {Array} requests List of API requests to perform at once.
 *
 * @return {Promise} Promise that resolves to a list of objects containing
 *                   either `output` (if that request was succesful) or `error`
 *                   (if not ).
 */
export default async function defaultProcessor( requests ) {
	const batchResponse = await apiFetch( {
		path: '/batch/v1',
		method: 'POST',
		data: {
			validation: 'require-all-validate',
			requests: requests.map( ( request ) => ( {
				path: request.path,
				body: request.data, // Rename 'data' to 'body'.
				method: request.method,
				headers: request.headers,
			} ) ),
		},
	} );

	if ( batchResponse.failed ) {
		return batchResponse.responses.map( ( response ) => ( {
			error: response?.body,
		} ) );
	}

	return batchResponse.responses.map( ( response ) => {
		const result = {};
		if ( response.status >= 200 && response.status < 300 ) {
			result.output = response.body;
		} else {
			result.error = response.body;
		}
		return result;
	} );
}
