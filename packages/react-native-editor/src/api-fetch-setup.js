/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */
import { fetchRequest } from '@wordpress/react-native-bridge';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

const setTimeoutPromise = ( delay ) =>
	new Promise( ( resolve ) => setTimeout( resolve, delay ) );

const fetchHandler = ( { path }, retries = 20, retryCount = 1 ) => {
	if ( ! isPathSupported( path ) ) {
		return Promise.reject( `Unsupported path: ${ path }` );
	}

	const responsePromise = fetchRequest( path );

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
	[
		/wp\/v2\/(media|categories)\/?\d*?.*/i,
		/wpcom\/v2\/gutenberg\/.*/i,
	].some( ( pattern ) => pattern.test( path ) );

export default () => {
	apiFetch.setFetchHandler( ( options ) => fetchHandler( options ) );
};
