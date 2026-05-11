/**
 * External dependencies
 */
import * as fs from 'fs/promises';
import { dirname } from 'path';
import { expect } from '@playwright/test';
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

async function getAPIRootURL( request: APIRequestContext ) {
	// Discover the API root url using link header.
	// See https://developer.wordpress.org/rest-api/using-the-rest-api/discovery/#link-header
	const response = await request.head( WP_BASE_URL );
	const links = response.headers().link;
	const restLink = links?.match( /<([^>]+)>; rel="https:\/\/api\.w\.org\/"/ );

	if ( ! restLink ) {
		throw new Error( `Failed to discover REST API endpoint.
 Link header: ${ links }` );
	}

	const [ , rootURL ] = restLink;

	return rootURL;
}

async function setupRest( this: RequestUtils ): Promise< StorageState > {
	let nonce = '';
	let rootURL = '';

	// Poll until the REST API is discovered.
	// See https://github.com/WordPress/gutenberg/issues/61627
	await expect
		.poll(
			async () => {
				try {
					[ nonce, rootURL ] = await Promise.all( [
						this.login(),
						getAPIRootURL( this.request ),
					] );
				} catch ( error ) {
					// Prints the error if the timeout is reached.
					return error;
				}

				return !! ( nonce && rootURL );
			},
			{
				message: 'Failed to setup REST API.',
				timeout: 60_000, // 1 minute.
			}
		)
		.toBe( true );

	const { cookies } = await this.request.storageState();

	const storageState: StorageState = {
		cookies,
		nonce,
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

	if ( ! this.storageState?.nonce || ! this.storageState?.rootURL ) {
		await this.setupRest();
	}

	const relativePath = path.startsWith( '/' ) ? path.slice( 1 ) : path;

	const url = this.storageState!.rootURL + relativePath;

	try {
		const response = await this.request.fetch( url, {
			...fetchOptions,
			failOnStatusCode: false,
			headers: {
				'X-WP-Nonce': this.storageState!.nonce,
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
		if (
			typeof error === 'object' &&
			error !== null &&
			Object.prototype.hasOwnProperty.call( error, 'code' ) &&
			( error as { code: string } ).code === 'rest_cookie_invalid_nonce'
		) {
			await this.setupRest();

			return this.rest( options );
		}

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
