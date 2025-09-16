/**
 * Safely decodes a URI component with `decodeURIComponent`. Returns the URI component unmodified if
 * `decodeURIComponent` throws an error.
 *
 * @param uriComponent URI component to decode.
 *
 * @return Decoded URI component if possible.
 */
export function safeDecodeURIComponent( uriComponent: string ): string {
	try {
		return decodeURIComponent( uriComponent );
	} catch ( uriComponentError ) {
		return uriComponent;
	}
}
