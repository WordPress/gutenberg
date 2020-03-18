/**
 * External dependencies
 */
import { join } from 'path';

/**
 * Creates a function to determine if a request has a parameter with a certain value.
 *
 * @param {string} parameterName The query parameter to check.
 * @param {string} value The value to check for.
 * @return {Function} Function that determines if a request's query parameter is the specified value.
 */
function parameterEquals( parameterName, value ) {
	return ( request ) =>
		new URL( request.url() ).searchParams.get( parameterName ) === value;
}

/**
 * Creates a function to determine if a request is a REST request of a given
 * path, accounting for variance in site permalink configuration.
 *
 * @param {string} path REST path to test.
 *
 * @return {Function} Function that determines if a request is a REST request of
 *                    a given path, accounting for variance in site permalink
 *                    configuration.
 */
function isRESTRoute( path ) {
	return ( request ) =>
		parameterEquals( 'rest_route', path )( request ) ||
		new URL( request.url() ).pathname.endsWith( join( '/wp-json', path ) );
}

/**
 * Creates a function to determine if a request is embedding a certain URL.
 *
 * @param {string} url The URL to check against a request.
 * @return {Function} Function that determines if a request is for the embed API, embedding a specific URL.
 */
export function createEmbeddingMatcher( url ) {
	return ( request ) =>
		isRESTRoute( '/oembed/1.0/proxy' )( request ) &&
		parameterEquals( 'url', url )( request );
}
