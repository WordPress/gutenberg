/**
 * Internal dependencies
 */
import { createURLMatcher } from './create-url-matcher';

/**
 * Creates a function to determine if a request has a parameter with a certain value.
 *
 * @param {string} parameterName The query parameter to check.
 * @param {string} value The value to check for.
 * @return {Function} Function that determines if a request's query parameter is the specified value.
 */
function parameterEquals( parameterName, value ) {
	return ( request ) => {
		const url = request.url();
		const match = new RegExp( `.*${ parameterName }=([^&]+).*` ).exec( url );
		if ( ! match ) {
			return false;
		}
		return value === decodeURIComponent( match[ 1 ] );
	};
}

/**
 * Creates a function to determine if a request is embedding a certain URL.
 *
 * @param {string} url The URL to check against a request.
 * @return {Function} Function that determines if a request is for the embed API, embedding a specific URL.
 */
export function createEmbeddingMatcher( url ) {
	return ( request ) =>
		createURLMatcher( 'oembed%2F1.0%2Fproxy' )( request ) &&
		parameterEquals( 'url', url )( request );
}
