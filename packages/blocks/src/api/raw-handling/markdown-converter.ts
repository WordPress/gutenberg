/**
 * External dependencies
 */
// @ts-ignore
import showdown from 'showdown';
import { v4 as uuid } from 'uuid';

const gutenbergFootnotes = () => {
	return [
		{
			type: 'lang',
			filter: ( text ) => {
				const footnotes = new Map();

				// Extract footnote definitions [^id]: content
				text = text.replace(
					/^\[\^([^\]]+)\]:\s*(.+)$/gm,
					( match, id, content ) => {
						const footnoteId = uuid();
						footnotes.set( id, {
							content: content.trim(),
							id: footnoteId,
						} );
						return ''; // Remove the definition from main text
					}
				);

				// Replace footnote references [^id] with WordPress-style footnotes
				text = text.replace( /\[\^([^\]]+)\]/g, ( match, id ) => {
					const footnote = footnotes.get( id );
					if ( footnote ) {
						return `<sup data-fn="${ footnote.id }" class="fn" contenteditable="false" data-rich-text-format-boundary="true"><a href="#${ footnote.id }-link" id="${ footnote.id }-link">${ id }</a></sup>`;
					}
					return match;
				} );

				// Add footnotes block at the end if there are footnotes
				if ( footnotes.size > 0 ) {
					const footnoteItems = Array.from( footnotes.values() )
						.map( ( footnote ) => {
							return `<li><span role="textbox" aria-multiline="true" id="${ footnote.id }" contenteditable="false" class="block-editor-rich-text__editable rich-text" data-wp-block-attribute-key="${ footnote.id }" style="white-space: pre-wrap; min-width: 1px;"> ${ footnote.content } </span> <a href="#${ footnote.id }-link">↩︎</a></li>`;
						} )
						.join( '' );

					const blockId = uuid();

					const footnotesBlock = `<ol tabindex="0" draggable="true" class="block-editor-block-list__block wp-block wp-block-footnotes" id="block-${ blockId }" role="document" aria-label="Block: Footnotes" data-block="${ blockId }" data-type="core/footnotes" data-title="Footnotes">${ footnoteItems }</ol>`;

					text += '\n\n' + footnotesBlock;
				}

				return text;
			},
		},
	];
};

// Reuse the same showdown converter.
const converter = new showdown.Converter( {
	noHeaderId: true,
	tables: true,
	literalMidWordUnderscores: true,
	omitExtraWLInCodeBlocks: true,
	simpleLineBreaks: true,
	strikethrough: true,
	extensions: [ gutenbergFootnotes ],
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
	return converter.makeHtml(
		correctors.reduce(
			( current, corrector ) => corrector( current ),
			text
		)
	);
}
