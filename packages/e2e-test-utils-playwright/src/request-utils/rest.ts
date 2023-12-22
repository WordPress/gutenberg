/**
 * External dependencies
 */
import * as fs from 'fs/promises';
import { dirname } from 'path';
import type { APIRequestContext } from '@playwright/test';

/**
 * Internal dependencies
 */
import { WP_BASE_URL } from '../config';
import type { RequestUtils, StorageState } from './index';

function splitRequestsToChunks( requests: BatchRequest[], chunkSize: number ) {
	const arr = [ ...requests ];
	const cache = [];
	while ( arr.length ) {
		cache.push( arr.splice( 0, chunkSize ) );
	}

	return cache;
}

async function setupRest( this: RequestUtils ): Promise< StorageState > {
	const rootURL = 'https://public-api.wordpress.com/';
	const bearerToken = await this.login();

	const { cookies } = await this.request.storageState();

	const storageState: StorageState = {
		cookies,
		bearerToken,
		rootURL,
	};

	if ( this.storageStatePath ) {
		await fs.mkdir( dirname( this.storageStatePath ), { recursive: true } );
		await fs.writeFile(
			this.storageStatePath,
			JSON.stringify( storageState ),
			'utf-8'
		);
	}

	this.storageState = storageState;

	return storageState;
}

type RequestFetchOptions = Exclude<
	Parameters< APIRequestContext[ 'fetch' ] >[ 1 ],
	undefined
>;
export interface RestOptions extends RequestFetchOptions {
	path: string;
}

async function rest< RestResponse = any >(
	this: RequestUtils,
	options: RestOptions
): Promise< RestResponse > {
	const { path, ...fetchOptions } = options;

	if ( ! path ) {
		throw new Error( '"path" is required to make a REST call' );
	}

	if ( ! this.storageState?.bearerToken || ! this.storageState?.rootURL ) {
		await this.setupRest();
	}

	const wpcomPath = path.replace(
		'/wp/v2/',
		`/wp/v2/sites/${ new URL( WP_BASE_URL ).host }/`
	);

	const relativePath = wpcomPath.startsWith( '/' )
		? wpcomPath.slice( 1 )
		: wpcomPath;

	const url = this.storageState!.rootURL + relativePath;

	try {
		const response = await this.request.fetch( url, {
			...fetchOptions,
			failOnStatusCode: false,
			headers: {
				Authorization: `Bearer ${ this.storageState!.bearerToken }`,
				...( fetchOptions.headers || {} ),
			},
		} );
		const json: RestResponse = await response.json();

		if ( ! response.ok() ) {
			throw json;
		}

		return json;
	} catch ( error ) {
		// Nonce in invalid, retry again with a renewed nonce.
		// if (
		// 	typeof error === 'object' &&
		// 	error !== null &&
		// 	Object.prototype.hasOwnProperty.call( error, 'code' ) &&
		// 	( error as { code: string } ).code === 'rest_cookie_invalid_nonce'
		// ) {
		// 	await this.setupRest();

		// 	return this.rest( options );
		// }

		throw error;
	}
}

/**
 * Get the maximum batch size for the REST API.
 *
 * @param this
 * @param forceRefetch Force revalidate the cached max batch size.
 */
async function getMaxBatchSize( this: RequestUtils, forceRefetch = false ) {
	if ( ! forceRefetch && this.maxBatchSize ) {
		return this.maxBatchSize;
	}

	const response = await this.rest< {
		endpoints: {
			args: {
				requests: {
					maxItems: number;
				};
			};
		}[];
	} >( {
		method: 'OPTIONS',
		path: '/batch/v1',
	} );
	this.maxBatchSize = response.endpoints[ 0 ].args.requests.maxItems;
	return this.maxBatchSize;
}

export interface BatchRequest {
	method?: string;
	path: string;
	headers?: Record< string, string | string[] >;
	body?: any;
}

async function batchRest< BatchResponse >(
	this: RequestUtils,
	requests: BatchRequest[]
): Promise< BatchResponse[] > {
	const maxBatchSize = await this.getMaxBatchSize();

	if ( requests.length > maxBatchSize ) {
		const chunks = splitRequestsToChunks( requests, maxBatchSize );

		const chunkResponses = await Promise.all(
			chunks.map( ( chunkRequests ) =>
				this.batchRest< BatchResponse >( chunkRequests )
			)
		);

		return chunkResponses.flat();
	}

	const batchResponses = await this.rest< {
		failed?: string;
		responses: BatchResponse[];
	} >( {
		method: 'POST',
		path: '/batch/v1',
		data: {
			requests,
			validation: 'require-all-validate',
		},
	} );

	if ( batchResponses.failed ) {
		throw batchResponses;
	}

	return batchResponses.responses;
}

export { setupRest, rest, getMaxBatchSize, batchRest };
