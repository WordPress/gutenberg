/**
 * Build the CSS selector that matches an in-content `<mark>` marker by its id.
 *
 * Both consumers of the inline-markers primitive serialize their marker as a
 * `<mark>` carrying a class token and an id attribute (`wp-note` /`data-id` for
 * Notes, `wp-suggestion-<kind>` / `data-suggestion-id` for Suggestions), so resolving
 * a marker element from the DOM — to tint it, to scroll to it, or to anchor a
 * floating card to it — is the same operation for both.
 *
 * Pass several class tokens when one id spans markers of different kinds
 * (Suggestion mode's `wp-suggestion-add`, `-del` and `-format`): the selector
 * then matches a marker carrying any of them.
 *
 * @param className   Exact class token on the marker, or a list of them.
 * @param idAttribute Attribute holding the marker id.
 * @param id          Marker id to match.
 * @return Selector for the marker element(s).
 */
export function getMarkerSelector(
	className: string | readonly string[],
	idAttribute: string,
	id: number | string
): string {
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
			: `\\${ char.codePointAt( 0 )!.toString( 16 ) } `
	);
	const tokens = typeof className === 'string' ? [ className ] : className;
	const classes =
		tokens.length === 1
			? `.${ tokens[ 0 ] }`
			: `:is(${ tokens.map( ( token ) => `.${ token }` ).join( ', ' ) })`;
	return `mark${ classes }[${ idAttribute }="${ escapedId }"]`;
}
