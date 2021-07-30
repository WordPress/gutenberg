/**
 * WordPress dependencies
 */
import { fetchRequest } from '@wordpress/react-native-bridge';
import apiFetch from '@wordpress/api-fetch';

// Please add only wp.org API paths here!
const SUPPORTED_ENDPOINTS = [
	/wp\/v2\/(media|categories|blocks)\/?\d*?.*/i,
	/wp\/v2\/search\?.*/i,
];

// [ONLY ON ANDROID] The requests made to these endpoints won't be cached.
const DISABLED_CACHING_ENDPOINTS = [ /wp\/v2\/(blocks)\/?\d*?.*/i ];

const setTimeoutPromise = ( delay ) =>
	new Promise( ( resolve ) => setTimeout( resolve, delay ) );

const fetchHandler = ( { path }, retries = 20, retryCount = 1 ) => {
	if ( ! isPathSupported( path ) ) {
		return Promise.reject( `Unsupported path: ${ path }` );
	}

	const responsePromise = fetchRequest( path, shouldEnableCaching( path ) );

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

export const isPathSupported = ( path ) =>
	SUPPORTED_ENDPOINTS.some( ( pattern ) => pattern.test( path ) );

export const shouldEnableCaching = ( path ) =>
	! DISABLED_CACHING_ENDPOINTS.some( ( pattern ) => pattern.test( path ) );

export default () => {
	apiFetch.setFetchHandler( ( options ) => fetchHandler( options ) );
};
