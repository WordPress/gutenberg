/**
 * Attributes whose value is a URL, and which therefore have to be checked
 * before they are bound. Some of them, like `href` on an anchor or `action` on
 * a form, execute a `javascript:` URL when the element is activated.
 *
 * This list mirrors wp_kses_uri_attributes() in PHP. It also includes some names
 * that cannot be bound today, as hardening against future changes.
 */
export const urlAttributes = new Set( [
	'action',
	'archive',
	'background',
	'cite',
	'classid',
	'codebase',
	'data',
	'formaction',
	'href',
	'icon',
	'longdesc',
	'manifest',
	'poster',
	'profile',
	'src',
	'usemap',
	'xlink:href',
	'xlinkhref',
	'xmlns',
] );

/**
 * Matches a string whose URL scheme is `javascript`.
 *
 * @see https://url.spec.whatwg.org/#concept-basic-url-parser
 *
 * - Remove any leading and trailing C0 control or space from input.
 * - Remove all ASCII tab or newline from input.
 *
 * Then check for a `javascript:` scheme.
 *
 * This check is inspired by React DOM's `sanitizeURL` function.
 *
 * @see https://github.com/react/react/blob/07dde64da1abd1525120b9ae49672386486e33c3/packages/react-dom-bindings/src/shared/sanitizeURL.js
 */
const isJavaScriptProtocol =
	/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i;

/**
 * Gets the value to bind to a URL attribute.
 *
 * Null, undefined and booleans are returned as they are. Any other value is
 * converted to a string once, and that string is both checked and returned, so
 * the URL that is checked is the URL that is bound.
 *
 * @param value Value to bind.
 * @return The value to bind, or null if it is a `javascript:` URL or cannot be
 *         converted to a string.
 */
export function getSafeUrl(
	value: unknown
): null | undefined | boolean | string {
	if ( value === null || value === undefined || typeof value === 'boolean' ) {
		return value;
	}
	try {
		const url = String( value );
		return isJavaScriptProtocol.test( url ) ? null : url;
	} catch {
		return null;
	}
}
