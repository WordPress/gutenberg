import { getPhrasingContentSchema, removeInvalidHTML } from '@wordpress/dom';
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
import nonBreakingSpaceCorrector from './non-breaking-space-corrector';
import htmlFormattingRemover from './html-formatting-remover';
import formatSpaceCorrector from './format-space-corrector';
import brRemover from './br-remover';
import { deepFilterHTML, isPlain, getBlockContentSchema } from './utils';
import emptyParagraphRemover from './empty-paragraph-remover';
import slackParagraphCorrector from './slack-paragraph-corrector';
import isLatexMathMode from './latex-to-math';
import { createBlock } from '../factory';
import headingTransformer from './heading-transformer';
import type { Block, RawHandlerOptions } from '../../types';

const log = ( ...args: unknown[] ): void => window?.console?.log?.( ...args );

/**
 * Filters HTML to only contain phrasing content.
 *
 * @param HTML The HTML to filter.
 *
 * @return HTML only containing phrasing content.
 */
function filterInlineHTML( HTML: string ): string {
	HTML = deepFilterHTML( HTML, [
		headRemover,
		googleDocsUIDRemover,
		msListIgnore,
		phrasingContentReducer,
		commentRemover,
	] );
	HTML = removeInvalidHTML(
		HTML,
		getPhrasingContentSchema( 'paste' ) as Parameters<
			typeof removeInvalidHTML
		>[ 1 ],
		true
	);

	HTML = deepFilterHTML( HTML, [
		nonBreakingSpaceCorrector,
		htmlFormattingRemover,
		formatSpaceCorrector,
		brRemover,
	] );

	// Allows us to ask for this information when we get a report.
	log( 'Processed inline HTML:\n\n', HTML );

	return HTML;
}

/**
 * Strips what the clipboard wraps copied HTML in: meta tags and the Windows
 * html, body and fragment markers.
 *
 * @param HTML The HTML as read from the clipboard.
 *
 * @return The HTML without the wrappers.
 */
function stripClipboardWrappers( HTML: string ): string {
	// First of all, strip any meta tags.
	HTML = HTML.replace( /<meta[^>]+>/g, '' );
	// Strip Windows markers.
	HTML = HTML.replace(
		/^\s*<html[^>]*>\s*<body[^>]*>(?:\s*<!--\s*StartFragment\s*-->)?/i,
		''
	);
	return HTML.replace(
		/(?:<!--\s*EndFragment\s*-->\s*)?<\/body>\s*<\/html>\s*$/i,
		''
	);
}

/**
 * Normalises unwrapped clipboard HTML before it is classified as plain text,
 * inline content or blocks.
 *
 * @param HTML The HTML without clipboard wrappers.
 *
 * @return The normalised HTML.
 */
function normaliseClipboardHTML( HTML: string ): string {
	// Normalize unicode to use composed characters.
	// Not normalizing the content will only affect older browsers and won't
	// entirely break the app.
	// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
	// See: https://core.trac.wordpress.org/ticket/30130
	// See: https://github.com/WordPress/gutenberg/pull/6983#pullrequestreview-125151075
	HTML = HTML.normalize();

	// Must be run before checking if it's inline content.
	return deepFilterHTML( HTML, [ slackParagraphCorrector ] );
}

/**
 * Whether normalised clipboard content counts as plain text, which the paste
 * handler then parses as Markdown:
 * * There is a plain text version.
 * * There is no HTML version, or it has no formatting.
 *
 * @param HTML      The normalised HTML.
 * @param plainText The plain text version.
 *
 * @return Whether the content is plain text.
 */
function isPlainClipboardContent( HTML: string, plainText: string ): boolean {
	return !! plainText && ( ! HTML || isPlain( HTML ) );
}

/**
 * Whether the paste handler would read the clipboard as plain text and parse
 * it as Markdown, rather than as HTML or as serialised blocks. Lets a plain
 * text field keep such a paste verbatim: the Markdown conversion consumes
 * characters like `#` or `**` that the field has no formatting to carry.
 *
 * Answers `false` for any serialised blocks, while the handler still falls
 * back to the plain text path when they parse to a single freeform block.
 *
 * @param options
 * @param options.HTML      The HTML as read from the clipboard.
 * @param options.plainText The plain text as read from the clipboard.
 *
 * @return Whether the clipboard holds plain text.
 */
export function isPlainTextPaste( {
	HTML = '',
	plainText = '',
}: Pick< RawHandlerOptions, 'HTML' | 'plainText' > ): boolean {
	HTML = stripClipboardWrappers( HTML );

	// Serialised blocks are parsed as blocks, whatever their source.
	if ( ( HTML || plainText ).indexOf( '<!-- wp:' ) !== -1 ) {
		return false;
	}

	return isPlainClipboardContent( normaliseClipboardHTML( HTML ), plainText );
}

/**
 * Converts an HTML string to known blocks. Strips everything else.
 *
 * @param options
 * @param options.HTML      The HTML to convert.
 * @param options.plainText Plain text version.
 * @param options.mode      Handle content as blocks or inline content.
 *                          * 'AUTO': Decide based on the content passed.
 *                          * 'INLINE': Always handle as inline content, and return string.
 *                          * 'BLOCKS': Always handle as blocks, and return array of blocks.
 * @param options.tagName   The tag into which content will be inserted.
 *
 * @return A list of blocks or a string, depending on `handlerMode`.
 */
export function pasteHandler( {
	HTML = '',
	plainText = '',
	mode = 'AUTO',
	tagName,
}: RawHandlerOptions ): Block[] | string {
	// Allows us to ask for this information when we get a report.
	log( 'Received HTML (pasteHandler):\n\n', HTML );
	log( 'Received plain text (pasteHandler):\n\n', plainText );

	HTML = stripClipboardWrappers( HTML );

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

	HTML = normaliseClipboardHTML( HTML );

	const isPlainText = isPlainClipboardContent( HTML, plainText );

	if ( isPlainText && isLatexMathMode( plainText ) ) {
		return [ createBlock( 'core/math', { latex: plainText } ) ];
	}

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
				headingTransformer,
			];

			const schema = {
				...blockContentSchema,
				// Keep top-level phrasing content, normalised by `normaliseBlocks`.
				...phrasingContentSchema,
			} as Parameters< typeof removeInvalidHTML >[ 1 ];

			piece = deepFilterHTML( piece, filters, blockContentSchema );
			piece = removeInvalidHTML( piece, schema, false );
			piece = normaliseBlocks( piece );
			piece = deepFilterHTML(
				piece,
				[
					nonBreakingSpaceCorrector,
					htmlFormattingRemover,
					formatSpaceCorrector,
					brRemover,
					emptyParagraphRemover,
				],
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
				phrasingContentSchema as Parameters<
					typeof removeInvalidHTML
				>[ 1 ],
				false
			).replace( trimRegex, '' );
		}
	}

	return blocks;
}
