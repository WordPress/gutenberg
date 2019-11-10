/** @format */

/**
 * External dependencies
 */
import { fetchRequest } from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

const fetchHandler = ( options ) => {
	const responsePromise = fetchRequest( options.path );

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

export default () => {
	apiFetch.setFetchHandler( ( options ) => fetchHandler( options ) );
};
