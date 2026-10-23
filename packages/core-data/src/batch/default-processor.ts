import apiFetch from '@wordpress/api-fetch';
import type {
	BatchPreflightResponse,
	BatchRequest,
	BatchResponse,
	BatchResult,
} from './types';

/**
 * Maximum number of requests to place in a single batch request. Obtained by
 * sending a preflight OPTIONS request to /batch/v1/.
 */
let maxItems: number | null = null;

function chunk< T >(
	arr: ReadonlyArray< T >,
	chunkSize: number
): Array< Array< T > > {
	const tmp = [ ...arr ];
	const cache: Array< Array< T > > = [];
	while ( tmp.length ) {
		cache.push( tmp.splice( 0, chunkSize ) );
	}

	return cache;
}

/**
 * Default batch processor. Sends its input requests to /batch/v1.
 *
 * @param requests List of API requests to perform at once.
 *
 * @return Promise that resolves to a list of objects containing
 *         either `output` (if that request was successful) or `error`
 *         (if not ).
 */
export default async function defaultProcessor(
	requests: ReadonlyArray< BatchRequest >
): Promise< Array< BatchResult > > {
	if ( maxItems === null ) {
		const preflightResponse = await apiFetch< BatchPreflightResponse >( {
			path: '/batch/v1',
			method: 'OPTIONS',
		} );
		maxItems = preflightResponse.endpoints[ 0 ].args.requests.maxItems;
	}

	const results: Array< BatchResult > = [];

	for ( const batchRequests of chunk( requests, maxItems ) ) {
		const batchResponse = await apiFetch< BatchResponse >( {
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

		let batchResults: Array< BatchResult >;

		if ( batchResponse.failed ) {
			batchResults = batchResponse.responses.map( ( response ) => ( {
				error: response?.body,
			} ) );
		} else {
			batchResults = batchResponse.responses.map( ( response ) => {
				const result: BatchResult = {};
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
