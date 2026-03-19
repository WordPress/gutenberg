/**
 * WordPress dependencies
 */
import { pipe } from '@wordpress/compose';

/**
 * Strips a leading `language-` prefix from a language identifier and removes
 * any whitespace, normalising it to a plain class-token-safe string.
 *
 * @param {string} value Raw language input.
 * @return {string} Sanitized language slug.
 */
export function sanitizeLanguage( value ) {
	return value
		.trim()
		.replace( /^language-/i, '' )
		.replace( /\s+/g, '' );
}

/**
 * Returns the HTML string representation of a RichTextData object or plain
 * string, preserving whitespace (newlines are kept as-is, not as <br>).
 *
 * @param {string|Object} value A plain string or RichTextData object.
 * @return {string} HTML string.
 */
export function toHTMLStr( value ) {
	if ( typeof value === 'string' ) {
		return value;
	}
	return value?.toHTMLString?.( { preserveWhiteSpace: true } ) ?? '';
}

/**
 * Parses a Markdown fenced code opening (3 backticks + language) from a
 * content value.
 * By default, this only matches a complete opening line ending in a newline.
 *
 * @param {string|Object} value                    RichTextData or plain string content.
 * @param {Object}        options                  Parsing options.
 * @param {boolean}       options.allowEndOfString Whether to accept end-of-string
 *                                                 instead of a trailing newline.
 * @return {Object|null} Parsed result with `content` and `language`, or null.
 */
export function parseFencedCode( value, { allowEndOfString = false } = {} ) {
	const htmlString = toHTMLStr( value );
	const openingFenceRegExp = allowEndOfString
		? /^```[ \t]*([^\s`]+)[ \t]*(?:\r?\n|$)/
		: /^```[ \t]*([^\s`]+)[ \t]*\r?\n/;
	const openingFenceMatch = htmlString.match( openingFenceRegExp );
	if ( ! openingFenceMatch ) {
		return null;
	}

	const parsedLanguage = sanitizeLanguage( openingFenceMatch[ 1 ] );
	let parsedContent = htmlString.slice( openingFenceMatch[ 0 ].length );

	// Strip a trailing closing fence if present.
	parsedContent = parsedContent.replace( /\r?\n```[ \t]*$/, '' );

	return {
		content: parsedContent,
		language: parsedLanguage,
	};
}

/**
 * Escapes ampersands, shortcodes, and links.
 *
 * @param {string} content The content of a code block.
 * @return {string} The given content with some characters escaped.
 */
export function escape( content ) {
	return pipe(
		escapeOpeningSquareBrackets,
		escapeProtocolInIsolatedUrls
	)( content || '' );
}

/**
 * Returns the given content with all opening shortcode characters converted
 * into their HTML entity counterpart (i.e. [ => &#91;). For instance, a
 * shortcode like [embed] becomes &#91;embed]
 *
 * This function replicates the escaping of HTML tags, where a tag like
 * <strong> becomes &lt;strong>.
 *
 * @param {string} content The content of a code block.
 * @return {string} The given content with its opening shortcode characters
 *                  converted into their HTML entity counterpart
 *                  (i.e. [ => &#91;)
 */
function escapeOpeningSquareBrackets( content ) {
	return content.replace( /\[/g, '&#91;' );
}

/**
 * Converts the first two forward slashes of any isolated URL into their HTML
 * counterparts (i.e. // => &#47;&#47;). For instance, https://youtube.com/watch?x
 * becomes https:&#47;&#47;youtube.com/watch?x.
 *
 * An isolated URL is a URL that sits in its own line, surrounded only by spacing
 * characters.
 *
 * See https://github.com/WordPress/wordpress-develop/blob/5.1.1/src/wp-includes/class-wp-embed.php#L403
 *
 * @param {string} content The content of a code block.
 * @return {string} The given content with its ampersands converted into
 *                  their HTML entity counterpart (i.e. & => &amp;)
 */
function escapeProtocolInIsolatedUrls( content ) {
	return content.replace(
		/^(\s*https?:)\/\/([^\s<>"]+\s*)$/m,
		'$1&#47;&#47;$2'
	);
}
