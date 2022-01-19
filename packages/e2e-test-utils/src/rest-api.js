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
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { WP_BASE_URL, WP_ADMIN_USER } from './shared/config';
import { createURL } from './create-url';

/**
 * @typedef {Object} StorageState
 * @property {string} cookie  The login cookie.
 * @property {string} nonce   The login nonce.
 * @property {string} rootURL The REST API root url.
 */

// `apiFetch` expects `window.fetch` to be available in its default handler.
global.window = global.window || {};
global.window.fetch = fetch;

const REST_NONCE_ENDPOINT = createURL(
	'wp-admin/admin-ajax.php',
	'action=rest-nonce'
);

class AdminStorageState {
	/**
	 * Initialize the admin storage state from disk.
	 *
	 * @param {string} [storageStatePath] The storage state path.
	 * @return {Promise<AdminStorageState>} The AdminStorageState instance.
	 */
	static async init( storageStatePath ) {
		/** @type {Partial<StorageState>} */
		let initialStorageState = {};

		if ( storageStatePath ) {
			try {
				initialStorageState = JSON.parse(
					await fs.readFile( storageStatePath, 'utf-8' )
				);
			} catch ( error ) {
				// Ignore errors if the state is not found or invalid.
			}
		}

		return new AdminStorageState( initialStorageState, storageStatePath );
	}

	/**
	 * The class to update and save the admin storage state.
	 *
	 * @param {Partial<StorageState>} initialStorageState The initial storage state.
	 * @param {string}                [storageStatePath]  The optional storage state path.
	 */
	constructor( initialStorageState, storageStatePath ) {
		/**
		 * @private
		 * @type {Partial<StorageState>}
		 */
		this._storageState = initialStorageState;
		/**
		 * @private
		 * @type {string | undefined}
		 */
		this._storageStatePath = storageStatePath;
		/**
		 * @private
		 * @type {boolean}
		 */
		this._hasUpdated = false;
	}

	get value() {
		return this._storageState;
	}

	set value( storageState ) {
		this._storageState = storageState;
		this._hasUpdated = true;
	}

	/**
	 * Save the admin storage state to disk.
	 *
	 * @return {Promise<void>}
	 */
	async save() {
		if ( this._storageStatePath && this._hasUpdated ) {
			await fs.mkdir( path.dirname( this._storageStatePath ), {
				recursive: true,
			} );

			await fs.writeFile(
				this._storageStatePath,
				JSON.stringify( this._storageState ),
				'utf-8'
			);

			this._hasUpdated = false;
		}
	}
}

/**
 * Get the API root url.
 *
 * @return {Promise<string>} The API root url.
 */
async function getAPIRootURL() {
	// Discover the API root url using link header.
	// See https://developer.wordpress.org/rest-api/using-the-rest-api/discovery/#link-header
	const res = await fetch( WP_BASE_URL, { method: 'HEAD' } );
	const links = res.headers.get( 'link' );
	const restLink = links.match( /<([^>]+)>; rel="https:\/\/api\.w\.org\/"/ );

	if ( ! restLink ) {
		throw new Error( `Failed to discover REST API endpoint.
Link header: ${ links }` );
	}

	const [ , rootURL ] = restLink;

	return rootURL;
}

/**
 * Login as admin's username and password and return the login cookie.
 *
 * @return {Promise<string>} The login cookie.
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

/**
 * Get the nonce.
 *
 * @param {string} cookie The login cookie.
 * @return {Promise<string>} The nonce.
 */
async function getNonce( cookie ) {
	const response = await fetch( REST_NONCE_ENDPOINT, {
		headers: { cookie },
	} );

	if ( response.status !== 200 ) {
		throw response;
	}

	const nonce = await response.text();

	return nonce;
}

/**
 * Setup the rest API client.
 *
 * @param {string} [storageStatePath] Optional storage state path to save.
 * @return {Promise<StorageState>} The admin storage state.
 */
async function setupRest( storageStatePath ) {
	const adminStorageState = await AdminStorageState.init( storageStatePath );

	if ( ! adminStorageState.value.cookie ) {
		adminStorageState.value.cookie = await loginAsAdmin();
	}

	if ( ! adminStorageState.value.nonce ) {
		adminStorageState.value.nonce = await getNonce(
			adminStorageState.value.cookie
		);
	}

	if ( ! adminStorageState.value.rootURL ) {
		adminStorageState.value.rootURL = await getAPIRootURL();
	}

	await adminStorageState.save();

	// Register nonce endpoint.
	apiFetch.nonceEndpoint = REST_NONCE_ENDPOINT;

	// Create the nonce middleware and set the initial nonce as an empty string.
	apiFetch.nonceMiddleware = apiFetch.createNonceMiddleware(
		adminStorageState.value.nonce
	);

	// Register the nonce middleware.
	apiFetch.use( apiFetch.nonceMiddleware );

	// Register root url middleware.
	apiFetch.use(
		apiFetch.createRootURLMiddleware( adminStorageState.value.rootURL )
	);

	// For the nonce to work we have to also pass the cookies.
	apiFetch.use( function setCookieMiddleware( request, next ) {
		return next( {
			...request,
			headers: {
				...request.headers,
				cookie: adminStorageState.value.cookie,
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
			adminStorageState.value.cookie = cookie;

			// Renew the nonce.
			const nonce = await getNonce( cookie );
			adminStorageState.value.nonce = nonce;
			apiFetch.nonceMiddleware.nonce = nonce;

			await adminStorageState.save();

			return apiFetch( request );
		} );
	} );

	/** @type {StorageState} */
	return adminStorageState.value;
}

/**
 * Call REST API using `apiFetch` to build and clear test states.
 *
 * @param {Object} [options] `apiFetch` options.
 * @return {Promise<any>} The response value.
 */
async function rest( options = {} ) {
	return await apiFetch( options );
}

/** @type {number} */
let cacheMaxBatchSize;
async function getMaxBatchSize() {
	if ( cacheMaxBatchSize ) {
		return cacheMaxBatchSize;
	}

	const response = await rest( {
		method: 'OPTIONS',
		path: '/batch/v1',
	} );
	cacheMaxBatchSize = response.endpoints[ 0 ].args.requests.maxItems;
	return cacheMaxBatchSize;
}

/**
 * Call a set of REST APIs in batch.
 * See https://make.wordpress.org/core/2020/11/20/rest-api-batch-framework-in-wordpress-5-6/
 * Note that calling GET requests in batch is not supported.
 *
 * @param {Array<Object>} requests The request objects.
 * @return {Promise<any>} The response value.
 */
async function batch( requests ) {
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
