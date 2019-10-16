/**
 * External dependencies
 *
 * @format
 */

/**
 * External dependencies
 */
import { fetchRequest } from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

const fetchHandler = ( nextOptions, extraHeaders ) => {
	const { url, ...remainingOptions } = nextOptions;

	headers = { ...apiFetch.DEFAULT_HEADERS, ...extraHeaders };

	const options = {
		headers,
		...remainingOptions,
	};
	const responsePromise = fetch( url, options );

	const parseResponse = ( response ) => {
		return response.json();
	};

	return responsePromise.then( parseResponse ).catch( ( error ) => {
		return error;
	} );
};

const wpcomPathMappingMiddleware = ( options, next, siteSlug ) => {
	// wp/v2 namespace mapping
	//
	// Path rewrite example:
	// 		/wp/v2/types/post →
	//		/wp/v2/sites/example.wordpress.com/types/post
	if ( /\/wp\/v2\//.test( options.path ) ) {
		const path = options.path.replace( '/wp/v2/', `/wp/v2/sites/${ siteSlug }/` );

		return next( { ...options, path } );
	}
	return next( options );
};

export default ( setupApiFetch = ( siteSlug = '', headers = {} ) => {
	apiFetch.use( apiFetch.createRootURLMiddleware( 'https://public-api.wordpress.com/' ) );
	apiFetch.use( ( options, next ) => wpcomPathMappingMiddleware( options, next, siteSlug ) );
	apiFetch.setFetchHandler( ( options ) => fetchHandler( options, headers ) );
} );
