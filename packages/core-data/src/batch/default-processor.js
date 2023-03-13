/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Maximum number of requests to place in a single batch request. Obtained by
 * sending a preflight OPTIONS request to /batch/v1/.
 *
 * @type {number?}
 */
let maxItems = null;

function chunk( arr, chunkSize ) {
	const tmp = [ ...arr ];
	const cache = [];
	while ( tmp.length ) {
		cache.push( tmp.splice( 0, chunkSize ) );
	}

	return cache;
}

/**
 * Default batch processor. Sends its input requests to /batch/v1.
 *
 * @param {Array} requests List of API requests to perform at once.
 *
 * @return {Promise} Promise that resolves to a list of objects containing
 *                   either `output` (if that request was successful) or `error`
 *                   (if not ).
 */
export default async function defaultProcessor( requests ) {
	if ( maxItems === null ) {
		const preflightResponse = await apiFetch( {
			path: '/batch/v1',
			method: 'OPTIONS',
		} );
		maxItems = preflightResponse.endpoints[ 0 ].args.requests.maxItems;
	}

	const results = [];

	// @ts-ignore We would have crashed or never gotten to this point if we hadn't received the maxItems count.
	for ( const batchRequests of chunk( requests, maxItems ) ) {
		const batchResponse = await apiFetch( {
			path: '/batch/v1',
			method: 'POST',
			data: {
				validation: 'require-all-validate',
				requests: batchRequests.map( ( request ) => ( {
					path: request.path,
					body: request.data, // Rename 'data' to 'body'.
					method: request.method,
					headers: request.headers,
				} ) ),
			},
		} );

		let batchResults;

		if ( batchResponse.failed ) {
			batchResults = batchResponse.responses.map( ( response ) => ( {
				error: response?.body,
			} ) );
		} else {
			batchResults = batchResponse.responses.map( ( response ) => {
				const result = {};
				if ( response.status >= 200 && response.status < 300 ) {
					result.output = response.body;
				} else {
					result.error = response.body;
				}
				return result;
			} );
		}

		results.push( ...batchResults );
	}

	return results;
}
