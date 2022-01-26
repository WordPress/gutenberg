/**
 * External dependencies
 */
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import type { Browser, Protocol } from 'puppeteer-core';

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
	cookies: Protocol.Network.Cookie[];
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

async function loginAsAdmin( browser: Browser ) {
	const page = await browser.newPage();
	await page.goto( createURL( 'wp-login.php' ) );

	const usernameInput = await page.$< HTMLInputElement >( '#user_login' );
	await usernameInput!.evaluate(
		( node, username ) => ( node.value = username ),
		WP_ADMIN_USER.username
	);
	const passwordInput = await page.$< HTMLInputElement >( '#user_pass' );
	await passwordInput!.evaluate(
		( node, username ) => ( node.value = username ),
		WP_ADMIN_USER.password
	);

	await Promise.all( [
		page.waitForNavigation(),
		page.click( '#wp-submit' ),
	] );

	const cookies = await page.cookies();

	await page.goto( REST_NONCE_ENDPOINT );

	const nonce = await page.evaluate( () => document.body.textContent! );

	await page.close();

	return { cookies, nonce };
}

async function setupRest( browser: Browser, storageStatePath?: string ) {
	const adminStorageState = await AdminStorageState.init( storageStatePath );

	if (
		! adminStorageState.value.cookies ||
		! adminStorageState.value.nonce
	) {
		const { cookies, nonce } = await loginAsAdmin( browser );
		adminStorageState.update( 'cookies', cookies );
		adminStorageState.update( 'nonce', nonce );
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
	apiFetch.use( async function setCookieMiddleware( request, next ) {
		const cookieString = adminStorageState.value
			.cookies!.map( ( cookie ) => `${ cookie.name }=${ cookie.value }` )
			.join( ';' );

		try {
			return next( {
				...request,
				headers: {
					...request.headers,
					cookie: cookieString,
				},
			} );
		} catch ( error ) {
			// The default nonce handler from `apiFetch` won't pass server-side cookies
			// automatically, so we handle it here manually in a middleware.
			if (
				error instanceof Error &&
				( error as NodeJS.ErrnoException ).code !==
					'rest_cookie_invalid_nonce'
			) {
				throw error;
			}

			/**
			 * We can't be sure either the cookie or the nonce is invalid,
			 * hence updating them both.
			 */
			// Renew the cookies and nonce.
			const { cookies, nonce } = await loginAsAdmin( browser );
			adminStorageState.update( 'cookies', cookies );
			adminStorageState.update( 'nonce', nonce );
			apiFetch.nonceMiddleware!.nonce = nonce;

			await adminStorageState.save();

			return apiFetch( request );
		}
	} );

	return adminStorageState.value as StorageState;
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
