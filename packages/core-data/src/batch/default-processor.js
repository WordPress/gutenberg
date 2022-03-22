/**
 * External dependencies
 */
import { chunk } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/** How long to wait to hear back from the server for batch size before defaulting. */
const BATCH_SIZE_FETCH_TIMEOUT_MS = 1000;

/** Default value shipped with Core */
const DEFAULT_BATCH_SIZE = 25;

/**
 * Maximum number of requests to place in a single batch request. Obtained by
 * sending a preflight OPTIONS request to /batch/v1/.
 *
 * @type {number|null}
 * @default 25 (set by Core)
 */
let maxItems = null;

/**
 * Waits a given number of milliseconds then resolves.
 *
 * @param {number} msDelay How many milliseconds to wait before resolving.
 */
const wait = ( msDelay ) =>
	new Promise( ( resolve ) => setTimeout( resolve, msDelay ) );

/**
 * Returns the batching API batch size, updated from the server.
 *
 * @return {Promise<number>} How many API requests to send in one batch.
 */
const batchSize = async () => {
	if ( null !== maxItems ) {
		return maxItems;
	}

	const fetcher = apiFetch( { path: '/batch/v1', method: 'OPTIONS' } ).then(
		( { endpoints } ) => {
			try {
				maxItems = endpoints[ 0 ].args.requests.maxItems;
			} catch ( e ) {
				// Catching and re-throwing in a new task lets us fall back
				// to the default value while still surfacing the error.
				// We do this so that we don't block the batched API calls.
				setTimeout( () => {
					throw e;
				}, 0 );
			}
		}
	);

	await Promise.race( [ wait( BATCH_SIZE_FETCH_TIMEOUT_MS ), fetcher ] );

	return maxItems ?? DEFAULT_BATCH_SIZE;
};

/**
 * Default batch processor. Sends its input requests to /batch/v1.
 *
 * @param {Array} requests List of API requests to perform at once.
 *
 * @return {Promise} Resolves to a list of objects containing either
 *                   `output` if that request was successful else `error`.
 */
export default async function defaultProcessor( requests ) {
	const results = [];

	for ( const batchRequests of chunk( requests, await batchSize() ) ) {
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
