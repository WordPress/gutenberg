/**
 * External dependencies
 */
import fetch from 'node-fetch';
import FormData from 'form-data';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { WP_BASE_URL } from './shared/config';
import { createURL } from './create-url';

// `apiFetch` expects `window.fetch` to be available in its default handler.
global.window = global.window || {};
global.window.fetch = fetch;

const setAPIRootURL = ( async () => {
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
	apiFetch.use( apiFetch.createRootURLMiddleware( rootURL ) );
} )();

async function login( retries = 3 ) {
	const formData = new FormData();
	formData.append( 'log', 'admin' );
	formData.append( 'pwd', 'password' );

	// Login to admin using fetch.
	const loginResponse = await fetch( createURL( 'wp-login.php' ), {
		method: 'POST',
		headers: formData.getHeaders(),
		body: formData,
		redirect: 'manual',
	} );

	// Retrieve the cookies.
	const cookies = loginResponse.headers.get( 'set-cookie' );
	const cookie = cookies
		.split( ',' )
		.map( ( setCookie ) => setCookie.split( ';' )[ 0 ] )
		.join( ';' );

	apiFetch.nonceEndpoint = createURL(
		'wp-admin/admin-ajax.php',
		'action=rest-nonce'
	);

	// Get the initial nonce.
	const response = await fetch( apiFetch.nonceEndpoint, {
		headers: { cookie },
	} );

	if ( response.status === 200 ) {
		return {
			response,
			cookie,
		};
	}

	// Sometimes the nonce call will fail if a test has forced a new login
	// and invalidated the cookie, so retry the login in these instances.
	if ( retries > 0 ) {
		return login( retries - 1 );
	}

	throw new Error(
		`Fetch api call failed for ${ apiFetch.nonceEndpoint }: ${ response.status }`
	);
}

const setNonce = ( async () => {
	// Get the initial nonce.
	const loginRequest = await login();

	const nonce = await loginRequest.response.text();

	// Register the nonce middleware.
	apiFetch.use( apiFetch.createNonceMiddleware( nonce ) );

	// For the nonce to work we have to also pass the cookies.
	apiFetch.use( function setCookieMiddleware( request, next ) {
		return next( {
			...request,
			headers: {
				...request.headers,
				cookie: loginRequest.cookie,
			},
		} );
	} );
} )();

/**
 * Call REST API using `apiFetch` to build and clear test states.
 *
 * @param {Object} options `apiFetch` options.
 * @return {Promise<any>} The response value.
 */
async function rest( options = {} ) {
	// Only need to set them once but before any requests.
	await Promise.all( [ setAPIRootURL, setNonce ] );

	return await apiFetch( options );
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
	return await rest( {
		method: 'POST',
		path: '/batch/v1',
		data: {
			requests,
			validation: 'require-all-validate',
		},
	} );
}

export { rest, batch };
