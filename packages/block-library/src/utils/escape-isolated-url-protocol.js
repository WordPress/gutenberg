/**
 * Converts the first two forward slashes of any isolated URL into their HTML
 * counterparts (i.e. // => &#47;&#47;). For instance, https://example.com/x
 * becomes https:&#47;&#47;example.com/x.
 *
 * An isolated URL is a URL that sits on its own line, surrounded only by
 * spacing characters. WordPress core's `WP_Embed::autoembed()` looks for
 * exactly that pattern in the fully rendered post content — with no
 * awareness of surrounding HTML — and replaces it with an oEmbed card. That
 * turns a URL a user typed as literal text inside a `<pre>`-based block
 * (Preformatted, Verse, Code) into an unwanted embed. Breaking up the literal
 * `://` substring defeats that match while leaving the URL's rendered
 * appearance and copy-pasted value unchanged, since the browser decodes the
 * entities back to `//` when displaying the text.
 *
 * @see https://github.com/WordPress/wordpress-develop/blob/HEAD/src/wp-includes/class-wp-embed.php
 *
 * @param {string} content The block's text content.
 * @return {string} The given content with the protocol of every isolated URL escaped.
 */
export function escapeIsolatedUrlProtocol( content ) {
	// The `g` flag matters here: without it, `replace()` only touches the
	// first isolated URL, leaving a second or third one on its own line
	// (e.g. two links pasted into a Preformatted block) unescaped and still
	// vulnerable to `autoembed()`.
	return content.replace(
		/^(\s*https?:)\/\/([^\s<>"]+\s*)$/gm,
		'$1&#47;&#47;$2'
	);
}
