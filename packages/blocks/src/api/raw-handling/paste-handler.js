/**
 * WordPress dependencies
 */
import { getPhrasingContentSchema, removeInvalidHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { htmlToBlocks } from './html-to-blocks';
import { hasBlockSupport } from '../registration';
import { getBlockInnerHTML } from '../serializer';
import parse from '../parser';
import normaliseBlocks from './normalise-blocks';
import specialCommentConverter from './special-comment-converter';
import commentRemover from './comment-remover';
import isInlineContent from './is-inline-content';
import phrasingContentReducer from './phrasing-content-reducer';
import headRemover from './head-remover';
import msListConverter from './ms-list-converter';
import msListIgnore from './ms-list-ignore';
import listReducer from './list-reducer';
import imageCorrector from './image-corrector';
import blockquoteNormaliser from './blockquote-normaliser';
import divNormaliser from './div-normaliser';
import figureContentReducer from './figure-content-reducer';
import shortcodeConverter from './shortcode-converter';
import markdownConverter from './markdown-converter';
import iframeRemover from './iframe-remover';
import googleDocsUIDRemover from './google-docs-uid-remover';
import htmlFormattingRemover from './html-formatting-remover';
import brRemover from './br-remover';
import { deepFilterHTML, isPlain, getBlockContentSchema } from './utils';
import emptyParagraphRemover from './empty-paragraph-remover';
import slackParagraphCorrector from './slack-paragraph-corrector';

const log = ( ...args ) => window?.console?.log?.( ...args );

/**
 * Filters HTML to only contain phrasing content.
 *
 * @param {string} HTML The HTML to filter.
 *
 * @return {string} HTML only containing phrasing content.
 */
function filterInlineHTML( HTML ) {
	HTML = deepFilterHTML( HTML, [
		headRemover,
		googleDocsUIDRemover,
		msListIgnore,
		phrasingContentReducer,
		commentRemover,
	] );
	HTML = removeInvalidHTML( HTML, getPhrasingContentSchema( 'paste' ), {
		inline: true,
	} );

	HTML = deepFilterHTML( HTML, [ htmlFormattingRemover, brRemover ] );

	// Allows us to ask for this information when we get a report.
	log( 'Processed inline HTML:\n\n', HTML );

	return HTML;
}

/**
 * Converts an HTML string to known blocks. Strips everything else.
 *
 * @param {Object} options
 * @param {string} [options.HTML]      The HTML to convert.
 * @param {string} [options.plainText] Plain text version.
 * @param {string} [options.mode]      Handle content as blocks or inline content.
 *                                     * 'AUTO': Decide based on the content passed.
 *                                     * 'INLINE': Always handle as inline content, and return string.
 *                                     * 'BLOCKS': Always handle as blocks, and return array of blocks.
 * @param {Array}  [options.tagName]   The tag into which content will be inserted.
 *
 * @return {Array|string} A list of blocks or a string, depending on `handlerMode`.
 */
export function pasteHandler( {
	HTML = '',
	plainText = '',
	mode = 'AUTO',
	tagName,
} ) {
	// First of all, strip any meta tags.
	HTML = HTML.replace( /<meta[^>]+>/g, '' );
	// Strip Windows markers.
	HTML = HTML.replace(
		/^\s*<html[^>]*>\s*<body[^>]*>(?:\s*<!--\s*StartFragment\s*-->)?/i,
		''
	);
	HTML = HTML.replace(
		/(?:<!--\s*EndFragment\s*-->\s*)?<\/body>\s*<\/html>\s*$/i,
		''
	);

	// If we detect block delimiters in HTML, parse entirely as blocks.
	if ( mode !== 'INLINE' ) {
		// Check plain text if there is no HTML.
		const content = HTML ? HTML : plainText;

		if ( content.indexOf( '<!-- wp:' ) !== -1 ) {
			const parseResult = parse( content );
			const isSingleFreeFormBlock =
				parseResult.length === 1 &&
				parseResult[ 0 ].name === 'core/freeform';
			if ( ! isSingleFreeFormBlock ) {
				return parseResult;
			}
		}
	}

	// Normalize unicode to use composed characters.
	// Not normalizing the content will only affect older browsers and won't
	// entirely break the app.
	// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
	// See: https://core.trac.wordpress.org/ticket/30130
	// See: https://github.com/WordPress/gutenberg/pull/6983#pullrequestreview-125151075
	if ( String.prototype.normalize ) {
		HTML = HTML.normalize();
	}

	// Must be run before checking if it's inline content.
	HTML = deepFilterHTML( HTML, [ slackParagraphCorrector ] );

	// Consider plain text if:
	// * There is a plain text version.
	// * There is no HTML version, or it has no formatting.
	const isPlainText = plainText && ( ! HTML || isPlain( HTML ) );

	// Parse Markdown (and encoded HTML) if it's considered plain text.
	if ( isPlainText ) {
		HTML = plainText;

		// The markdown converter (Showdown) trims whitespace.
		if ( ! /^\s+$/.test( plainText ) ) {
			HTML = markdownConverter( HTML );
		}
	}

	// An array of HTML strings and block objects. The blocks replace matched
	// shortcodes.
	const pieces = shortcodeConverter( HTML );

	// The call to shortcodeConverter will always return more than one element
	// if shortcodes are matched. The reason is when shortcodes are matched
	// empty HTML strings are included.
	const hasShortcodes = pieces.length > 1;

	if ( isPlainText && ! hasShortcodes ) {
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

	if (
		mode === 'AUTO' &&
		! hasShortcodes &&
		isInlineContent( HTML, tagName )
	) {
		return filterInlineHTML( HTML );
	}

	const phrasingContentSchema = getPhrasingContentSchema( 'paste' );
	const blockContentSchema = getBlockContentSchema( 'paste' );

	const blocks = pieces
		.map( ( piece ) => {
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
				iframeRemover,
				figureContentReducer,
				blockquoteNormaliser(),
				divNormaliser,
			];

			const schema = {
				...blockContentSchema,
				// Keep top-level phrasing content, normalised by `normaliseBlocks`.
				...phrasingContentSchema,
			};

			piece = deepFilterHTML( piece, filters, blockContentSchema );
			piece = removeInvalidHTML( piece, schema );
			piece = normaliseBlocks( piece );
			piece = deepFilterHTML(
				piece,
				[ htmlFormattingRemover, brRemover, emptyParagraphRemover ],
				blockContentSchema
			);

			// Allows us to ask for this information when we get a report.
			log( 'Processed HTML piece:\n\n', piece );

			return htmlToBlocks( piece, pasteHandler );
		} )
		.flat()
		.filter( Boolean );

	// If we're allowed to return inline content, and there is only one
	// inlineable block, and the original plain text content does not have any
	// line breaks, then treat it as inline paste.
	if (
		mode === 'AUTO' &&
		blocks.length === 1 &&
		hasBlockSupport( blocks[ 0 ].name, '__unstablePasteTextInline', false )
	) {
		const trimRegex = /^[\n]+|[\n]+$/g;
		// Don't catch line breaks at the start or end.
		const trimmedPlainText = plainText.replace( trimRegex, '' );

		if (
			trimmedPlainText !== '' &&
			trimmedPlainText.indexOf( '\n' ) === -1
		) {
			return removeInvalidHTML(
				getBlockInnerHTML( blocks[ 0 ] ),
				phrasingContentSchema
			).replace( trimRegex, '' );
		}
	}

	return blocks;
}
