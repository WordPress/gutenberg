/**
 * External dependencies
 */
import { flatMap, filter, compact } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock, getBlockTransforms, findTransform } from '../factory';
import { getBlockContent } from '../serializer';
import { getBlockAttributes, parseWithGrammar } from '../parser';
import normaliseBlocks from './normalise-blocks';
import specialCommentConverter from './special-comment-converter';
import commentRemover from './comment-remover';
import isInlineContent from './is-inline-content';
import phrasingContentReducer from './phrasing-content-reducer';
import headRemover from './head-remover';
import msListConverter from './ms-list-converter';
import listReducer from './list-reducer';
import imageCorrector from './image-corrector';
import blockquoteNormaliser from './blockquote-normaliser';
import figureContentReducer from './figure-content-reducer';
import shortcodeConverter from './shortcode-converter';
import markdownConverter from './markdown-converter';
import iframeRemover from './iframe-remover';
import googleDocsUIDRemover from './google-docs-uid-remover';
import { getPhrasingContentSchema } from './phrasing-content';
import {
	deepFilterHTML,
	isPlain,
	removeInvalidHTML,
	getBlockContentSchema,
} from './utils';

/**
 * Browser dependencies
 */
const { console } = window;

/**
 * Filters HTML to only contain phrasing content.
 *
 * @param {string} HTML The HTML to filter.
 *
 * @return {string} HTML only containing phrasing content.
 */
function filterInlineHTML( HTML ) {
	HTML = deepFilterHTML( HTML, [ googleDocsUIDRemover, phrasingContentReducer, commentRemover ] );
	HTML = removeInvalidHTML( HTML, getPhrasingContentSchema(), { inline: true } );

	// Allows us to ask for this information when we get a report.
	console.log( 'Processed inline HTML:\n\n', HTML );

	return HTML;
}

function getRawTransformations() {
	return filter( getBlockTransforms( 'from' ), { type: 'raw' } )
		.map( ( transform ) => {
			return transform.isMatch ? transform : {
				...transform,
				isMatch: ( node ) => transform.selector && node.matches( transform.selector ),
			};
		} );
}

/**
 * Converts HTML directly to blocks. Looks for a matching transform for each
 * top-level tag. The HTML should be filtered to not have any text between
 * top-level tags and formatted in a way that blocks can handle the HTML.
 *
 * @param  {Object} $1               Named parameters.
 * @param  {string} $1.html          HTML to convert.
 * @param  {Array}  $1.rawTransforms Transforms that can be used.
 *
 * @return {Array} An array of blocks.
 */
function htmlToBlocks( { html, rawTransforms } ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = html;

	return Array.from( doc.body.children ).map( ( node ) => {
		const rawTransform = findTransform( rawTransforms, ( { isMatch } ) => isMatch( node ) );

		if ( ! rawTransform ) {
			return createBlock(
				// Should not be hardcoded.
				'core/html',
				getBlockAttributes(
					'core/html',
					node.outerHTML
				)
			);
		}

		const { transform, blockName } = rawTransform;

		if ( transform ) {
			return transform( node );
		}

		return createBlock(
			blockName,
			getBlockAttributes(
				blockName,
				node.outerHTML
			)
		);
	} );
}

/**
 * Converts an HTML string to known blocks. Strips everything else.
 *
 * @param {string}  [options.HTML]                     The HTML to convert.
 * @param {string}  [options.plainText]                Plain text version.
 * @param {string}  [options.mode]                     Handle content as blocks or inline content.
 *                                                     * 'AUTO': Decide based on the content passed.
 *                                                     * 'INLINE': Always handle as inline content, and return string.
 *                                                     * 'BLOCKS': Always handle as blocks, and return array of blocks.
 * @param {Array}   [options.tagName]                  The tag into which content will be inserted.
 * @param {boolean} [options.canUserUseUnfilteredHTML] Whether or not the user can use unfiltered HTML.
 *
 * @return {Array|string} A list of blocks or a string, depending on `handlerMode`.
 */
export function pasteHandler( { HTML = '', plainText = '', mode = 'AUTO', tagName, canUserUseUnfilteredHTML = false } ) {
	// First of all, strip any meta tags.
	HTML = HTML.replace( /<meta[^>]+>/, '' );

	// If we detect block delimiters in HTML, parse entirely as blocks.
	if ( mode !== 'INLINE' ) {
		// Check plain text if there is no HTML.
		const content = HTML ? HTML : plainText;

		if ( content.indexOf( '<!-- wp:' ) !== -1 ) {
			return parseWithGrammar( content );
		}
	}

	// Normalize unicode to use composed characters.
	// This is unsupported in IE 11 but it's a nice-to-have feature, not mandatory.
	// Not normalizing the content will only affect older browsers and won't
	// entirely break the app.
	// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
	// See: https://core.trac.wordpress.org/ticket/30130
	// See: https://github.com/WordPress/gutenberg/pull/6983#pullrequestreview-125151075
	if ( String.prototype.normalize ) {
		HTML = HTML.normalize();
	}

	// Parse Markdown (and encoded HTML) if:
	// * There is a plain text version.
	// * There is no HTML version, or it has no formatting.
	if ( plainText && ( ! HTML || isPlain( HTML ) ) ) {
		HTML = markdownConverter( plainText );

		// Switch to inline mode if:
		// * The current mode is AUTO.
		// * The original plain text had no line breaks.
		// * The original plain text was not an HTML paragraph.
		// * The converted text is just a paragraph.
		if (
			mode === 'AUTO' &&
			plainText.indexOf( '\n' ) === -1 &&
			plainText.indexOf( '<p>' ) !== 0 &&
			HTML.indexOf( '<p>' ) === 0
		) {
			mode = 'INLINE';
		}
	}

	if ( mode === 'INLINE' ) {
		return filterInlineHTML( HTML );
	}

	// An array of HTML strings and block objects. The blocks replace matched
	// shortcodes.
	const pieces = shortcodeConverter( HTML );

	// The call to shortcodeConverter will always return more than one element
	// if shortcodes are matched. The reason is when shortcodes are matched
	// empty HTML strings are included.
	const hasShortcodes = pieces.length > 1;

	if ( mode === 'AUTO' && ! hasShortcodes && isInlineContent( HTML, tagName ) ) {
		return filterInlineHTML( HTML );
	}

	const rawTransforms = getRawTransformations();
	const phrasingContentSchema = getPhrasingContentSchema();
	const blockContentSchema = getBlockContentSchema( rawTransforms );

	const blocks = compact( flatMap( pieces, ( piece ) => {
		// Already a block from shortcode.
		if ( typeof piece !== 'string' ) {
			return piece;
		}

		const filters = [
			googleDocsUIDRemover,
			msListConverter,
			headRemover,
			listReducer,
			imageCorrector,
			phrasingContentReducer,
			specialCommentConverter,
			commentRemover,
			figureContentReducer,
			blockquoteNormaliser,
		];

		if ( ! canUserUseUnfilteredHTML ) {
			// Should run before `figureContentReducer`.
			filters.unshift( iframeRemover );
		}

		const schema = {
			...blockContentSchema,
			// Keep top-level phrasing content, normalised by `normaliseBlocks`.
			...phrasingContentSchema,
		};

		piece = deepFilterHTML( piece, filters, blockContentSchema );
		piece = removeInvalidHTML( piece, schema );
		piece = normaliseBlocks( piece );

		// Allows us to ask for this information when we get a report.
		console.log( 'Processed HTML piece:\n\n', piece );

		return htmlToBlocks( { html: piece, rawTransforms } );
	} ) );

	// If we're allowed to return inline content and there is only one block
	// and the original plain text content does not have any line breaks, then
	// treat it as inline paste.
	if ( mode === 'AUTO' && blocks.length === 1 ) {
		const trimmedPlainText = plainText.trim();

		if ( trimmedPlainText !== '' && trimmedPlainText.indexOf( '\n' ) === -1 ) {
			return removeInvalidHTML(
				getBlockContent( blocks[ 0 ] ),
				phrasingContentSchema
			);
		}
	}

	return blocks;
}
