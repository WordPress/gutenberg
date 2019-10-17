/**
 * External dependencies
 *
 * @format
 */

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

const insertHeadersMiddleware = ( options, next, extraHeaders ) => {
	const { optionsHeaders = {}, ...extraOptions } = options;
	const headers = { ...optionsHeaders, ...extraHeaders };
	return next( { ...options, headers } );
};

const wpcomPathMappingMiddleware = ( options, next, siteSlug ) => {
	// wp/v2 namespace mapping
	//
	// Path rewrite example:
	//		/wp/v2/types/post →
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
	apiFetch.use( ( options, next ) => insertHeadersMiddleware( options, next, headers ) );
} );
