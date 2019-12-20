/** @format */

/**
 * External dependencies
 */
import { fetchRequest } from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

const setTimeoutPromise = ( delay ) => new Promise( ( resolve ) => setTimeout( resolve, delay ) );

const fetchHandler = ( { path }, retries = 20 ) => {
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
			return Promise.reject( error );
		} else if ( retries === 0 ) {
			return Promise.reject( error );
		}
		return setTimeoutPromise( 2000 ).then( () => fetchHandler( { path }, retries - 1 ) );
	} );
};

export const isPathSupported = ( path ) =>
	[ /wp\/v2\/media\/?\d*?.*/i ].some( ( pattern ) => pattern.test( path ) );

export default () => {
	apiFetch.setFetchHandler( ( options ) => fetchHandler( options ) );
};
