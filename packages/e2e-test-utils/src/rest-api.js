/**
 * External dependencies
 */
import fetch from 'node-fetch';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { WP_BASE_URL, WP_USERNAME, WP_PASSWORD } from './shared/config';

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

	const rootURL = restLink[ 1 ];
	apiFetch.use( apiFetch.createRootURLMiddleware( rootURL ) );
} )();

/**
 * Call REST API using `apiFetch` to build and clear test states.
 *
 * @param {Object} options `apiFetch` options.
 * @return {Promise<any>} The response value.
 */
async function rest( options = {} ) {
	await setAPIRootURL;

	return await apiFetch( {
		...options,
		headers: {
			...( options.headers || {} ),
			// Authorize via basic authentication and test plugin.
			Authorization: `Basic ${ Buffer.from(
				`${ WP_USERNAME }:${ WP_PASSWORD }`
			).toString( 'base64' ) }`,
		},
	} );
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
