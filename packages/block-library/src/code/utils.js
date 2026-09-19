import { pipe } from '@wordpress/compose';
import { escapeIsolatedUrlProtocol } from '../utils/escape-isolated-url-protocol';

/**
 * Escapes ampersands, shortcodes, and links.
 *
 * @param {string} content The content of a code block.
 * @return {string} The given content with some characters escaped.
 */
export function escape( content ) {
	return pipe(
		escapeOpeningSquareBrackets,
		escapeIsolatedUrlProtocol
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
