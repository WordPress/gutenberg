/**
 * External dependencies
 */
import * as fs from 'fs/promises';
import { dirname } from 'path';
import type { APIRequestContext } from '@playwright/test';
import { chunk } from 'lodash';

/**
 * Internal dependencies
 */
import { WP_BASE_URL } from '../config';
import type { RequestUtils, StorageState } from './index';

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
	const [ nonce, rootURL ] = await Promise.all( [
		this.login(),
		getAPIRootURL( this.request ),
	] );

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
interface RestOptions extends RequestFetchOptions {
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
 * @param {} this         RequestUtils.
 * @param {} forceRefetch Force revalidate the cached max batch size.
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

interface BatchRequest {
	method?: string;
	path: string;
	headers: Record< string, string | string[] >;
	body: any;
}

async function batchRest< BatchResponse >(
	this: RequestUtils,
	requests: BatchRequest[]
): Promise< BatchResponse[] > {
	const maxBatchSize = await this.getMaxBatchSize();

	if ( requests.length > maxBatchSize ) {
		const chunks = chunk( requests, maxBatchSize );

		const chunkResponses = await Promise.all(
			chunks.map( ( chunkRequests ) =>
				this.batchRest< BatchResponse >( chunkRequests )
			)
		);

		return chunkResponses.flat();
	}

	const { responses } = await this.rest< { responses: BatchResponse[] } >( {
		method: 'POST',
		path: '/batch/v1',
		data: {
			requests,
			validation: 'require-all-validate',
		},
	} );

	return responses;
}

export { setupRest, rest, getMaxBatchSize, batchRest };
