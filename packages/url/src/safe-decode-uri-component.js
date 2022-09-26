/**
 * Safely decodes a URI component with `decodeURIComponent`. Returns the URI component unmodified if
 * `decodeURIComponent` throws an error.
 *
 * @param {string} uriComponent URI component to decode.
 *
 * @return {string} Decoded URI component if possible.
 */
export function safeDecodeURIComponent( uriComponent ) {
	try {
		return decodeURIComponent( uriComponent );
	} catch ( uriComponentError ) {
		return uriComponent;
	}
}
