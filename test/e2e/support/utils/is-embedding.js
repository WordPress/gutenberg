/**
 * Internal dependencies
 */
import { matchURL } from './match-url';
import { parameterEquals } from './parameter-equals';

/**
 * Creates a function to determine if a request is embedding a certain URL.
 *
 * @param {string} url The URL to check against a request.
 * @return {function} Function that determines if a request is for the embed API, embedding a specific URL.
 */
export function isEmbedding( url ) {
	return ( request ) =>
		matchURL( 'oembed%2F1.0%2Fproxy' )( request ) &&
		parameterEquals( 'url', url )( request );
}
