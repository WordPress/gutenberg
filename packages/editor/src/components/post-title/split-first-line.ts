/**
 * Splits pasted plain text into the line that fits in the title and the lines
 * after it, which become blocks. Blank lines before the text and line breaks
 * after it are not content (the Markdown converter drops them too), so a
 * paste of a single line followed by its line break has no remainder.
 *
 * @param text The pasted plain text.
 *
 * @return The first line and the remainder, joined with `\n` and empty when
 *         there is none.
 */
export default function splitFirstLine( text: string ): [ string, string ] {
	const [ firstLine, ...rest ] = text
		.replace( /^(?:[ \t]*\r?\n)+|(?:\r?\n[ \t]*)+$/g, '' )
		.split( /\r?\n/ );
	return [ firstLine, rest.join( '\n' ) ];
}
