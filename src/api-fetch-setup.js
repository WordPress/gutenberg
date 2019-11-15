/** @format */

/**
 * External dependencies
 */
import { fetchRequest } from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

const fetchHandler = ( { path } ) => {
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
		return error;
	} );
};

export const isPathSupported = ( path ) =>
	[ /wp\/v2\/media\/\d*?.*/i ].some( ( pattern ) => pattern.test( path ) );

export default () => {
	apiFetch.setFetchHandler( ( options ) => fetchHandler( options ) );
};
