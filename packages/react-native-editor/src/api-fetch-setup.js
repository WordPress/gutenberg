/**
 * WordPress dependencies
 */
import { fetchRequest, postRequest } from '@wordpress/react-native-bridge';
import apiFetch from '@wordpress/api-fetch';
import { applyFilters } from '@wordpress/hooks';

const SUPPORTED_METHODS = [ 'GET', 'POST' ];
// Please add only wp.org API paths here!
const SUPPORTED_ENDPOINTS = {
	GET: [
		/wp\/v2\/(media|categories|blocks|themes)\/?\d*?.*/i,
		/wp\/v2\/search\?.*/i,
		/oembed\/1\.0\/proxy\?.*/i,
	],
	POST: [],
};

// [ONLY ON ANDROID] The requests made to these endpoints won't be cached.
const DISABLED_CACHING_ENDPOINTS = [ /wp\/v2\/(blocks)\/?\d*?.*/i ];

const setTimeoutPromise = ( delay ) =>
	new Promise( ( resolve ) => setTimeout( resolve, delay ) );

const fetchHandler = (
	{ path, method = 'GET', data },
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
		if ( typeof response === 'string' ) {
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

export const shouldEnableCaching = ( path ) =>
	! DISABLED_CACHING_ENDPOINTS.some( ( pattern ) => pattern.test( path ) );

export default () => {
	apiFetch.setFetchHandler( ( options ) => fetchHandler( options ) );
};
