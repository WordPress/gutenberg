import remove from './remove';

/**
 * Set of HTML tag names (in uppercase) that must be completely removed from the DOM.
 * Includes script tags and elements capable of embedding external executable resources.
 */
const DANGEROUS_TAGS = new Set( [ 'SCRIPT', 'IFRAME', 'OBJECT', 'EMBED' ] );

/**
 * Set of attribute names whose values must be validated against dangerous URI schemes.
 */
const DANGEROUS_URI_ATTRS = new Set( [
	'href',
	'src',
	'action',
	'formaction',
	'xlink:href',
	'data',
] );

/**
 * Regular expression to detect executable pseudo-protocols and dangerous MIME types.
 *
 * Pattern breakdown:
 * - `^(?:[\x00-\x20\s]*)` : Ignores leading ASCII control characters and whitespace.
 * - `(?:javascript|vbscript|data(?:\/|\:text\/html|\:image\/svg\+xml)):` : Matches script protocols or executable data URIs.
 * - `i` flag : Case-insensitive matching.
 */
const DANGEROUS_URI_PATTERN =
	/^(?:[\x00-\x20\s]*)(?:javascript|vbscript|data(?:\/|\:text\/html|\:image\/svg\+xml)):/i;

/**
 * Strips script tags, embedding elements, inline event handler attributes (`on*`),
 * and dangerous executable URI schemes (`javascript:`, `vbscript:`) from an HTML string.
 *
 * @note This helper provides lightweight client-side defense-in-depth sanitization.
 * It is designed under the assumption that untrusted user content has already been
 * sanitized on the server (e.g. via `wp_kses()` or `esc_url()`). It is NOT a full-spectrum
 * replacement for dedicated client-side sanitizers such as DOMPurify for completely untrusted input.
 *
 * @see https://github.com/cure53/DOMPurify for full client-side HTML sanitization.
 * @see https://developer.wordpress.org/apis/security/sanitizing/ for WordPress server-side sanitization.
 *
 * @param {string} html Raw HTML string to sanitize.
 *
 * @return {string} Sanitized HTML string.
 *
 * @example
 * ```js
 * import { safeHTML } from '@wordpress/dom';
 *
 * // Standard usage:
 * const clean = safeHTML( '<a href="https://example.com" onclick="alert(1)">Link</a>' );
 * // Returns: '<a href="https://example.com">Link</a>'
 *
 * // Stripping executable URIs:
 * const safeLink = safeHTML( '<a href="javascript:alert(1)">Click</a>' );
 * // Returns: '<a>Click</a>'
 * ```
 */
export default function safeHTML( html ) {
	const { body } = document.implementation.createHTMLDocument( '' );
	body.innerHTML = html;
	const elements = body.getElementsByTagName( '*' );
	let elementIndex = elements.length;

	while ( elementIndex-- ) {
		const element = elements[ elementIndex ];

		// Remove forbidden tags entirely
		if ( DANGEROUS_TAGS.has( element.tagName ) ) {
			remove( element );
		} else {
			let attributeIndex = element.attributes.length;

			while ( attributeIndex-- ) {
				const { name: key, value } =
					element.attributes[ attributeIndex ];
				const lowerKey = key.toLowerCase();

				// Strip inline event listeners (e.g. onclick, onload, onerror)
				if ( lowerKey.startsWith( 'on' ) ) {
					element.removeAttribute( key );
				// Strip attributes with executable URI schemes (e.g. href="javascript:...")
				} else if (
					DANGEROUS_URI_ATTRS.has( lowerKey ) &&
					DANGEROUS_URI_PATTERN.test( value )
				) {
					element.removeAttribute( key );
				}
			}
		}
	}

	return body.innerHTML;
}
