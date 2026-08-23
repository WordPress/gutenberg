/**
 * Build the CSS selector that matches an in-content `<mark>` marker by its id.
 *
 * Both consumers of the inline-markers primitive serialize their marker as a
 * `<mark>` carrying a class token and an id attribute (`wp-note` /`data-id` for
 * Notes, `wp-suggestion` / `data-suggestion-id` for Suggestions), so resolving
 * a marker element from the DOM — to tint it, to scroll to it, or to anchor a
 * floating card to it — is the same operation for both.
 *
 * @param {string}        className   Exact class token on the marker.
 * @param {string}        idAttribute Attribute holding the marker id.
 * @param {number|string} id          Marker id to match.
 * @return {string} Selector for the marker element(s).
 */
export function getMarkerSelector( className, idAttribute, id ) {
	/*
	 * The id is a server comment ID (always a positive integer), but the value
	 * composes a selector from stored data, so escape it defensively.
	 *
	 * Deliberately not `CSS.escape`: that escapes for *identifier* context,
	 * where a leading digit is illegal, so it renders the id 7 as `\37 `. That
	 * is valid, and matches, but it makes every generated rule unreadable.
	 * Inside a quoted attribute value the only characters that need escaping
	 * are the quote, the backslash, and raw line breaks (a parse error in a
	 * CSS string).
	 */
	const escapedId = String( id ).replace( /["\\\n\r\f]/g, ( char ) =>
		char === '"' || char === '\\'
			? `\\${ char }`
			: `\\${ char.codePointAt( 0 ).toString( 16 ) } `
	);
	return `mark.${ className }[${ idAttribute }="${ escapedId }"]`;
}
