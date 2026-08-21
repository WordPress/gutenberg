const remark = require( 'remark' );
const gfmSyntax = require( 'micromark-extension-gfm' );
const gfmMdast = require( 'mdast-util-gfm' );

/**
 * Stringify settings. The markers match the defaults of the stringifier in
 * remark 10, which this package used before remark 13.
 */
const settings = {
	bullet: '-',
	emphasis: '_',
	ruleSpaces: true,
	unsafe: [
		// `mdast-util-to-markdown` escapes an underscore next to a non-letter,
		// but its expressions consume the preceding character, so in a run of
		// underscores only the first is escaped and `__foo` becomes `\__foo`,
		// which renders wrong. Escape every underscore that follows another.
		{ character: '_', before: '(?<=_)', inConstruct: 'phrasing' },
	],
};

/**
 * Remark plugin adding GFM syntax: autolink literals, strikethrough, tables,
 * and task lists. Equivalent to `remark-gfm` 1.x, except for the table
 * construct fix below.
 */
function gfm() {
	const data = this.data();
	const syntax = gfmSyntax();

	// The table tokenizer consumes the line ending after a would-be header
	// row before it knows whether a delimiter row follows. While it waits,
	// micromark treats the next line as interrupting any open container, so
	// a paragraph continuation line inside a list item or block quote ends
	// the item instead of continuing it. Marking the construct lazy lets
	// micromark treat such lines as continuation, as it does for paragraphs.
	// The trade-off: an unindented line right after a table inside a
	// container continues the table instead of closing the container.
	syntax.flow.null = syntax.flow.null.map( ( construct ) => ( {
		...construct,
		lazy: true,
	} ) );

	add( 'micromarkExtensions', syntax );
	add( 'fromMarkdownExtensions', gfmMdast.fromMarkdown );
	add( 'toMarkdownExtensions', gfmMdast.toMarkdown() );

	function add( field, value ) {
		if ( data[ field ] ) {
			data[ field ].push( value );
		} else {
			data[ field ] = [ value ];
		}
	}
}

/**
 * Creates a remark processor with GFM syntax and the stringify settings used
 * by docgen.
 *
 * @return {Object} Unfrozen remark processor.
 */
module.exports = () => remark().use( gfm ).use( { settings } );
