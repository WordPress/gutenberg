/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { getPhrasingContentSchema } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { htmlToBlocks } from './html-to-blocks';
import parse from '../parser';
import normaliseBlocks from './normalise-blocks';
import specialCommentConverter from './special-comment-converter';
import listReducer from './list-reducer';
import blockquoteNormaliser from './blockquote-normaliser';
import figureContentReducer from './figure-content-reducer';
import shortcodeConverter from './shortcode-converter';
import { deepFilterHTML, getBlockContentSchema } from './utils';

export { pasteHandler } from './paste-handler';

export function deprecatedGetPhrasingContentSchema( context ) {
	deprecated( 'wp.blocks.getPhrasingContentSchema', {
		since: '5.6',
		alternative: 'wp.dom.getPhrasingContentSchema',
	} );
	return getPhrasingContentSchema( context );
}

/**
 * Converts an HTML string to known blocks.
 *
 * @param {Object} $1
 * @param {string} $1.HTML The HTML to convert.
 *
 * @return {Array} A list of blocks.
 */
export function rawHandler( { HTML = '' } ) {
	// If we detect block delimiters, parse entirely as blocks.
	if ( HTML.indexOf( '<!-- wp:' ) !== -1 ) {
		const parseResult = parse( HTML );
		const isSingleFreeFormBlock =
			parseResult.length === 1 &&
			parseResult[ 0 ].name === 'core/freeform';
		if ( ! isSingleFreeFormBlock ) {
			return parseResult;
		}
	}

	// An array of HTML strings and block objects. The blocks replace matched
	// shortcodes.
	const pieces = shortcodeConverter( HTML );
	const blockContentSchema = getBlockContentSchema();

	return pieces
		.map( ( piece ) => {
			// Already a block from shortcode.
			if ( typeof piece !== 'string' ) {
				return piece;
			}

			// These filters are essential for some blocks to be able to transform
			// from raw HTML. These filters move around some content or add
			// additional tags, they do not remove any content.
			const filters = [
				// Needed to adjust invalid lists.
				listReducer,
				// Needed to create more and nextpage blocks.
				specialCommentConverter,
				// Needed to create media blocks.
				figureContentReducer,
				// Needed to create the quote block, which cannot handle text
				// without wrapper paragraphs.
				blockquoteNormaliser( { raw: true } ),
			];

			piece = deepFilterHTML( piece, filters, blockContentSchema );
			piece = normaliseBlocks( piece, { raw: true } );

			return htmlToBlocks( piece, rawHandler );
		} )
		.flat()
		.filter( Boolean );
}
