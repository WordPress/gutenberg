/**
 * External dependencies
 */
import { Marked, type Tokens } from 'marked';

// Skip escaping `"` and `'` so shortcodes like `[gallery ids="123"]` survive
// for the shortcode converter to match.
function escapeBodyText( value: string ): string {
	return value
		.replace( /&(?!#?\w+;)/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' );
}

const converter = new Marked( {
	gfm: true,
	breaks: true,
	renderer: {
		// Match showdown's `omitExtraWLInCodeBlocks`: marked appends `\n`
		// before `</code>`, which leaks into the Code block's content as a
		// trailing blank line.
		code( { text, lang }: Tokens.Code ): string {
			const language = ( lang || '' ).match( /^\S*/ )?.[ 0 ];
			const cls = language
				? ` class="${ language } language-${ language }"`
				: '';
			return `<pre><code${ cls }>${ escapeBodyText(
				text
			) }</code></pre>`;
		},
		text( token: Tokens.Text | Tokens.Escape ): string | false {
			// Only the plain-text case differs (skip escaping quotes);
			// defer inline tokens and already-escaped text to marked's
			// default by returning `false`.
			if (
				( 'tokens' in token && token.tokens ) ||
				( 'escaped' in token && token.escaped )
			) {
				return false;
			}
			return escapeBodyText( token.text );
		},
	},
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
 * Escapes an ordered-list marker at the start of single-line input so prose
 * like "18. May 2021" isn't parsed as `<ol start="18"><li>May 2021</li></ol>`.
 *
 * @param text The potential Markdown text to correct.
 */
function escapeSingleLineOrderedListMarker( text: string ): string {
	if ( text.includes( '\n' ) ) {
		return text;
	}
	return text.replace( /^(\d+)\.(\s)/, '$1\\.$2' );
}

const correctors = [
	escapeSingleLineOrderedListMarker,
	bulletsToAsterisks,
	slackMarkdownVariantCorrector,
];

/**
 * Converts a piece of text into HTML based on any Markdown present.
 * Also decodes any encoded HTML.
 *
 * @param text The plain text to convert.
 *
 * @return HTML.
 */
export default function markdownConverter( text: string ): string {
	return converter.parse(
		correctors.reduce(
			( current, corrector ) => corrector( current ),
			text
		),
		{ async: false }
	);
}
