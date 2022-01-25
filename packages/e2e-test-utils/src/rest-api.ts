/**
 * External dependencies
 */
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

/**
 * WordPress dependencies
 */
import apiFetchModule from '@wordpress/api-fetch';
import type { APIFetchOptions } from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { WP_BASE_URL, WP_ADMIN_USER } from './shared/config';
import { createURL } from './create-url';

interface StorageState {
	cookie: string;
	nonce: string;
	rootURL: string;
}

const apiFetch: typeof apiFetchModule & {
	nonceEndpoint?: string;
	nonceMiddleware?: ReturnType< typeof apiFetchModule.createNonceMiddleware >;
} = apiFetchModule;

// `apiFetch` expects `window.fetch` to be available in its default handler.
global.window = global.window || {};
( global.window as any ).fetch = fetch;

const REST_NONCE_ENDPOINT = createURL(
	'wp-admin/admin-ajax.php',
	'action=rest-nonce'
);

class AdminStorageState {
	static async init( storageStatePath?: string ) {
		let initialStorageState: Partial< StorageState > = {};

		if ( storageStatePath ) {
			try {
				initialStorageState = JSON.parse(
					await fs.readFile( storageStatePath, 'utf-8' )
				);
			} catch ( error ) {
				if (
					error instanceof Error &&
					( error as NodeJS.ErrnoException ).code === 'ENOENT'
				) {
					// Ignore errors if the state is not found.
				} else {
					throw error;
				}
			}
		}

		return new AdminStorageState( initialStorageState, storageStatePath );
	}

	#storageState: Partial< StorageState >;
	#storageStatePath: string | undefined;
	#isDirty: boolean = false;

	constructor(
		initialStorageState: Partial< StorageState >,
		storageStatePath?: string
	) {
		this.#storageState = initialStorageState;
		this.#storageStatePath = storageStatePath;
	}

	get value() {
		return this.#storageState;
	}

	update< Key extends keyof StorageState >(
		key: Key,
		value: StorageState[ Key ]
	) {
		this.#storageState[ key ] = value;
		this.#isDirty = true;
	}

	async save() {
		if ( this.#storageStatePath && this.#isDirty ) {
			await fs.mkdir( path.dirname( this.#storageStatePath ), {
				recursive: true,
			} );

			await fs.writeFile(
				this.#storageStatePath,
				JSON.stringify( this.#storageState ),
				'utf-8'
			);

			this.#isDirty = false;
		}
	}
}

/**
 * Get the API root url.
 */
async function getAPIRootURL() {
	// Discover the API root url using link header.
	// See https://developer.wordpress.org/rest-api/using-the-rest-api/discovery/#link-header
	const res = await fetch( WP_BASE_URL, { method: 'HEAD' } );
	const links = res.headers.get( 'link' );
	const restLink = links?.match( /<([^>]+)>; rel="https:\/\/api\.w\.org\/"/ );

	if ( ! restLink ) {
		throw new Error( `Failed to discover REST API endpoint.
Link header: ${ links }` );
	}

	const [ , rootURL ] = restLink;

	return rootURL;
}

/**
 * Login as admin's username and password and return the login cookie.
 */
async function loginAsAdmin() {
	const formData = new FormData();
	formData.append( 'log', WP_ADMIN_USER.username );
	formData.append( 'pwd', WP_ADMIN_USER.password );

	// Login to admin using fetch.
	const loginResponse = await fetch( createURL( 'wp-login.php' ), {
		method: 'POST',
		headers: formData.getHeaders(),
		body: formData,
		redirect: 'manual',
	} );

	// Retrieve the cookies.
	const cookies = loginResponse.headers.raw()[ 'set-cookie' ];
	const cookie = cookies
		// Only retrieve the cookie value.
		.map( ( setCookie ) => setCookie.split( ';' )[ 0 ] )
		.join( ';' );

	return cookie;
}

async function getNonce( cookie: string ) {
	const response = await fetch( REST_NONCE_ENDPOINT, {
		headers: { cookie },
	} );

	if ( response.status !== 200 ) {
		try {
			// If there's a json error from the API, throw it.
			const errorBody = await response.clone().json();
			throw errorBody;
		} catch ( error ) {
			// Otherwise, fallback to throwing the response object.
			throw response;
		}
	}

	const nonce = await response.text();

	return nonce;
}

async function setupRest( storageStatePath?: string ) {
	const adminStorageState = await AdminStorageState.init( storageStatePath );

	if ( ! adminStorageState.value.cookie ) {
		adminStorageState.update( 'cookie', await loginAsAdmin() );
	}

	if ( ! adminStorageState.value.nonce ) {
		adminStorageState.update(
			'nonce',
			await getNonce( adminStorageState.value.cookie! )
		);
	}

	if ( ! adminStorageState.value.rootURL ) {
		adminStorageState.update( 'rootURL', await getAPIRootURL() );
	}

	await adminStorageState.save();

	// Register nonce endpoint.
	apiFetch.nonceEndpoint = REST_NONCE_ENDPOINT;

	// Create the nonce middleware and set the initial nonce.
	apiFetch.nonceMiddleware = apiFetch.createNonceMiddleware(
		adminStorageState.value.nonce!
	);

	// Register the nonce middleware.
	apiFetch.use( apiFetch.nonceMiddleware );

	// Register root url middleware.
	apiFetch.use(
		apiFetch.createRootURLMiddleware( adminStorageState.value.rootURL! )
	);

	// For the nonce to work we have to also pass the cookies.
	apiFetch.use( function setCookieMiddleware( request, next ) {
		return next( {
			...request,
			headers: {
				...request.headers,
				cookie: adminStorageState.value.cookie!,
			},
		} ).catch( async ( error ) => {
			// The default nonce handler from `apiFetch` won't pass server-side cookies
			// automatically, so we handle it here manually in a middleware.
			if ( error.code !== 'rest_cookie_invalid_nonce' ) {
				throw error;
			}

			/**
			 * We can't be sure either the cookie or the nonce is invalid,
			 * hence updating them both.
			 */

			// Renew the cookies.
			const cookie = await loginAsAdmin();
			adminStorageState.update( 'cookie', cookie );

			// Renew the nonce.
			const nonce = await getNonce( cookie );
			adminStorageState.update( 'nonce', nonce );
			apiFetch.nonceMiddleware!.nonce = nonce;

			await adminStorageState.save();

			return apiFetch( request );
		} );
	} );

	/** @type {StorageState} */
	return adminStorageState.value;
}

async function rest< RestResponse >(
	options: APIFetchOptions = {}
): Promise< RestResponse > {
	return await apiFetch( options );
}

let cacheMaxBatchSize: number | undefined;
async function getMaxBatchSize() {
	if ( cacheMaxBatchSize ) {
		return cacheMaxBatchSize;
	}

	const response = await rest< {
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
	cacheMaxBatchSize = response.endpoints[ 0 ].args.requests.maxItems;
	return cacheMaxBatchSize;
}

interface BatchRequest {
	method?: string;
	path: string;
	headers: Record< string, string | string[] >;
	body: any;
}

async function batch< BatchResponse >(
	requests: BatchRequest[]
): Promise< BatchResponse > {
	const maxBatchSize = await getMaxBatchSize();

	if ( requests.length > maxBatchSize ) {
		throw new Error(
			`Batch requests size is over the limit of ${ maxBatchSize }`
		);
	}

	return await rest( {
		method: 'POST',
		path: '/batch/v1',
		data: {
			requests,
			validation: 'require-all-validate',
		},
	} );
}

export { setupRest, rest, batch };
