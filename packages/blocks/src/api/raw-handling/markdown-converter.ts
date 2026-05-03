/**
 * External dependencies
 */
// @ts-ignore
import showdown from 'showdown';

// Reuse the same showdown converter.
const converter = new showdown.Converter( {
	noHeaderId: true,
	tables: true,
	literalMidWordUnderscores: true,
	omitExtraWLInCodeBlocks: true,
	simpleLineBreaks: true,
	strikethrough: true,
} );

/**
 * Corrects the Slack Markdown variant of the code block.
 * If uncorrected, it will be converted to inline code.
 *
 * @see https://get.slack.help/hc/en-us/articles/202288908-how-can-i-add-formatting-to-my-messages-#code-blocks
 *
 * @param text The potential Markdown text to correct.
 *
 * @return The corrected Markdown.
 */
function slackMarkdownVariantCorrector( text: string ): string {
	return text.replace(
		/((?:^|\n)```)([^\n`]+)(```(?:$|\n))/,
		( match, p1, p2, p3 ) => `${ p1 }\n${ p2 }\n${ p3 }`
	);
}

function bulletsToAsterisks( text: string ): string {
	return text.replace( /(^|\n)•( +)/g, '$1*$2' );
}

/**
 * Converts a piece of text into HTML based on any Markdown present.
 * Also decodes any encoded HTML.
 *
 * @param text The plain text to convert.
 *
 * @return HTML.
 */
export default function markdownConverter( text: string ): string {
	return converter.makeHtml(
		slackMarkdownVariantCorrector( bulletsToAsterisks( text ) )
	);
}
