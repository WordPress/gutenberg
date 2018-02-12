/**
 * Corrects the Slack Markdown variant of the code block.
 * If uncorrected, it will be converted to inline code.
 *
 * @see https://get.slack.help/hc/en-us/articles/202288908-how-can-i-add-formatting-to-my-messages-#code-blocks
 *
 * @param {string} text The potential Markdown text to correct.
 *
 * @return {string} The corrected Markdown.
 */
export default function( text ) {
	return text.replace(
		/((?:^|\n)```)([^\n`]+)(```(?:$|\n))/,
		( match, p1, p2, p3 ) => `${ p1 }\n${ p2 }\n${ p3 }`
	);
}
