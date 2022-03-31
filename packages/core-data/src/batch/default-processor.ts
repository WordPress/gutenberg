/**
 * External dependencies
 */
import { chunk } from 'lodash';

/**
 * Internal dependencies
 */
import type { BatchResponse, WrappedResponse } from './create-batch';

/**
 * WordPress dependencies
 */
import apiFetch, { APIFetchOptions } from '@wordpress/api-fetch';

/**
 * Information about the batch framework returned by an OPTIONS request.
 *
 * See https://make.wordpress.org/core/2020/11/20/rest-api-batch-framework-in-wordpress-5-6/
 */
interface BatchOptionsResponse {
	endpoints: [
		{
			args: {
				requests: {
					/**
					 * A plugin may change the number of allowed requests
					 * to batch at once from the default value of 25.
					 */
					maxItems: number;
				};
			};
		}
	];
}

interface BatchApiResponse< ReturnData extends any[] > {
	/** The batch endpoint wraps each individual response in a response envelope */
	responses: {
		[ Index in keyof ReturnData ]: {
			body: ReturnData[ Index ];
			status: number;
		};
	};
	failed?: boolean;
}

/**
 * Maximum number of requests to place in a single batch request. Obtained by
 * sending a preflight OPTIONS request to /batch/v1/.
 */
let maxItems: number | null = null;

/**
 * Default batch processor. Sends its input requests to /batch/v1.
 *
 * @param  requests List of API requests to perform at once.
 *
 * @return          Resolves a list whose items correspond to each item in
 *                  the `requests` arg, having `output` as the response to
 *                  the operation if it succeeded and `error` if it failed.
 */
export default async function defaultProcessor< ReturnData extends any[] >(
	requests: APIFetchOptions[]
): Promise< WrappedResponse< ReturnData > > {
	if ( maxItems === null ) {
		const preflightResponse = await apiFetch< BatchOptionsResponse >( {
			path: '/batch/v1',
			method: 'OPTIONS',
		} );
		maxItems = preflightResponse.endpoints[ 0 ].args.requests.maxItems;
	}

	const results = [];

	for ( const batchRequests of chunk( requests, maxItems ) ) {
		const batchResponse = await apiFetch< BatchApiResponse< ReturnData > >(
			{
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
			}
		);

		let batchResults: BatchResponse[];

		if ( batchResponse.failed ) {
			batchResults = batchResponse.responses.map( ( response ) => ( {
				error: response?.body,
			} ) );
		} else {
			batchResults = batchResponse.responses.map( ( response ) => {
				const result = {} as BatchResponse;
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

	return results as WrappedResponse< ReturnData >;
}
