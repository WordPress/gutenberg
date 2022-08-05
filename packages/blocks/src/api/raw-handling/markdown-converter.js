/**
 * External dependencies
 */
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt( {
	html: true,
	breaks: true,
} );

// Patch the MarkdownIt parser to correct the Slack variant of the code block.
const originalFence = md.renderer.rules.fence;
md.renderer.rules.fence = ( tokens, idx, options, env, slf ) => {
	const html = originalFence( tokens, idx, options, env, slf );
	return html.replace( /\n?<\/code><\/pre>\n$/, '</code></pre>\n' );
};

md.renderer.rules.s_open = () => '<del>';
md.renderer.rules.s_close = () => '</del>';

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
function slackMarkdownVariantCorrector( text ) {
	return text.replace(
		/((?:^|\n)```)([^\n`]+)(```(?:$|\n))/,
		( match, p1, p2, p3 ) => `${ p1 }\n${ p2 }\n${ p3 }`
	);
}

/**
 * Converts a piece of text into HTML based on any Markdown present.
 * Also decodes any encoded HTML.
 *
 * @param {string} text The plain text to convert.
 *
 * @return {string} HTML.
 */
export default function markdownConverter( text ) {
	return md.render( slackMarkdownVariantCorrector( text ) ).trimEnd();
}
