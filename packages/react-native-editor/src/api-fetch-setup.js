/**
 * WordPress dependencies
 */
import { fetchRequest, postRequest } from '@wordpress/react-native-bridge';
import apiFetch from '@wordpress/api-fetch';
import { applyFilters } from '@wordpress/hooks';

const SUPPORTED_METHODS = [ 'GET', 'POST' ];
// Please add only wp.org API paths here!
const SUPPORTED_ENDPOINTS = {
	// Temporarily disabling themes endpoint calls within the editor.
	// Issue: https://github.com/wordpress-mobile/WordPress-Android/issues/21034
	// The editor's GET requests to the themes endpoint are not functioning as expected.
	// This is likely due to the method used for performing GET requests within the host Android app.
	// TODO: Investigate and resolve the issue with GET requests from the editor.
	// Until then, themes endpoint calls are disabled to prevent unexpected behavior.
	GET: [
		/wp\/v2\/(media|categories|blocks)\/?\d*?.*/i,
		/wp\/v2\/search\?.*/i,
		/oembed\/1\.0\/proxy\?.*/i,
	],
	POST: [],
};

// [ONLY ON ANDROID] The requests made to these endpoints won't be cached.
const DISABLED_CACHING_ENDPOINTS = [
	/wp\/v2\/(blocks)\/?\d*?.*/i,
	/oembed\/1\.0\/proxy\?.*/i,
];

const setTimeoutPromise = ( delay ) =>
	new Promise( ( resolve ) => setTimeout( resolve, delay ) );

const fetchHandler = (
	{ path, method = 'GET', data, parse },
	retries = 20,
	retryCount = 1
) => {
	if ( ! isMethodSupported( method ) ) {
		return Promise.reject( `Unsupported method: ${ method }` );
	}

	if ( ! isPathSupported( path, method ) ) {
		return Promise.reject(
			`Unsupported path for method ${ method }: ${ path }`
		);
	}

	let responsePromise;
	switch ( method ) {
		case 'GET':
			responsePromise = fetchRequest( path, shouldEnableCaching( path ) );
			break;
		case 'POST':
			responsePromise = postRequest( path, data );
			break;
	}

	const parseResponse = ( response ) => {
		const isStringResponse = typeof response === 'string';

		// If the 'parse' parameter is false, return the response as a new Response object
		// with the JSON string. This is necessary because one of the middlewares in the API
		// fetch library expects the response to be a JavaScript Response object with JSON
		// functionality. By doing this, we ensure that the response is handled correctly
		// by fetch-all-middleware.
		if ( parse === false ) {
			const body = isStringResponse
				? response
				: JSON.stringify( response );
			return new Response( body, {
				headers: { 'Content-Type': 'application/json' },
			} );
		}

		if ( isStringResponse ) {
			response = JSON.parse( response );
		}
		return response;
	};

	return responsePromise.then( parseResponse ).catch( ( error ) => {
		// eslint-disable-next-line no-console
		console.warn( 'Network Error: ', JSON.stringify( error, null, 2 ) );
		if ( error.code >= 400 && error.code < 600 ) {
			return error;
		} else if ( retries === 0 ) {
			return Promise.reject( error );
		}
		return setTimeoutPromise( 1000 * retryCount ).then( () =>
			fetchHandler( { path }, retries - 1, retryCount + 1 )
		);
	} );
};

export const isMethodSupported = ( method ) =>
	SUPPORTED_METHODS.includes( method );

export const isPathSupported = ( path, method ) => {
	const supportedEndpoints = applyFilters(
		'native.supported_endpoints',
		SUPPORTED_ENDPOINTS
	);
	return supportedEndpoints[ method ].some( ( pattern ) =>
		pattern.test( path )
	);
};

export const shouldEnableCaching = ( path ) => {
	const disabledEndpoints = applyFilters(
		'native.disabled_caching_endpoints',
		DISABLED_CACHING_ENDPOINTS
	);

	return ! disabledEndpoints.some( ( pattern ) => pattern.test( path ) );
};

export default () => {
	apiFetch.setFetchHandler( ( options ) => fetchHandler( options ) );
};
