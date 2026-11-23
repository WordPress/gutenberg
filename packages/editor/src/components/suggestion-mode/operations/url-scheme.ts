/**
 * The URL scheme check applied to values a suggestion proposes, which another
 * author wrote and a reviewer's decision writes into content.
 */

/*
 * The protocols `wp_allowed_protocols()` allows by default, which the server
 * also checks a stored format delta's attribute values against.
 */
const ALLOWED_PROTOCOLS = new Set( [
	'http',
	'https',
	'ftp',
	'ftps',
	'mailto',
	'news',
	'irc',
	'irc6',
	'ircs',
	'gopher',
	'nntp',
	'feed',
	'telnet',
	'mms',
	'rtsp',
	'sms',
	'svn',
	'tel',
	'fax',
	'xmpp',
	'webcal',
	'urn',
] );

/**
 * Whether a value names a protocol outside the allowed ones. A value with no
 * scheme (a relative URL, a fragment) names none.
 *
 * @param value Attribute value.
 * @return True when the value names a disallowed protocol.
 */
export function hasDisallowedProtocol( value: string ): boolean {
	// Browsers ignore control characters and whitespace inside a scheme.
	const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(
		value.replace( /[\u0000- \u007f]/g, '' )
	);
	return !! scheme && ! ALLOWED_PROTOCOLS.has( scheme[ 1 ].toLowerCase() );
}
