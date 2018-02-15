/**
 * External dependencies
 */
import { find, get, compact } from 'lodash';
import showdown from 'showdown';

/**
 * Internal dependencies
 */
import { createBlock } from '../factory';
import { getBlockTypes, getUnknownTypeHandlerName } from '../registration';
import { getBlockAttributes, parseWithGrammar } from '../parser';
import normaliseBlocks from './normalise-blocks';
import stripAttributes from './strip-attributes';
import commentRemover from './comment-remover';
import createUnwrapper from './create-unwrapper';
import isInlineContent from './is-inline-content';
import formattingTransformer from './formatting-transformer';
import msListConverter from './ms-list-converter';
import listReducer from './list-reducer';
import imageCorrector from './image-corrector';
import blockquoteNormaliser from './blockquote-normaliser';
import tableNormaliser from './table-normaliser';
import inlineContentConverter from './inline-content-converter';
import embeddedContentReducer from './embedded-content-reducer';
import { deepFilterHTML, isInvalidInline, isNotWhitelisted, isPlain, isInline } from './utils';
import shortcodeConverter from './shortcode-converter';
import slackMarkdownVariantCorrector from './slack-markdown-variant-corrector';

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
 * @param {boolean} [options.canUserUseUnfilteredHTML] Whether or not to user can use unfiltered HTML.
 *
 * @return {Array|string} A list of blocks or a string, depending on `handlerMode`.
 */
export default function rawHandler( { HTML, plainText = '', mode = 'AUTO', tagName, canUserUseUnfilteredHTML = false } ) {
	// First of all, strip any meta tags.
	HTML = HTML.replace( /<meta[^>]+>/, '' );

	// If we detect block delimiters, parse entirely as blocks.
	if ( mode !== 'INLINE' && HTML.indexOf( '<!-- wp:' ) !== -1 ) {
		return parseWithGrammar( HTML );
	}

	// Parse Markdown (and HTML) if:
	// * There is a plain text version.
	// * The HTML version has no formatting.
	if ( plainText && isPlain( HTML ) ) {
		const converter = new showdown.Converter();

		converter.setOption( 'noHeaderId', true );
		converter.setOption( 'tables', true );
		converter.setOption( 'omitExtraWLInCodeBlocks', true );
		converter.setOption( 'simpleLineBreaks', true );

		plainText = slackMarkdownVariantCorrector( plainText );

		HTML = converter.makeHtml( plainText );

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

	// An array of HTML strings and block objects. The blocks replace matched shortcodes.
	const pieces = shortcodeConverter( HTML );

	// The call to shortcodeConverter will always return more than one element if shortcodes are matched.
	// The reason is when shortcodes are matched empty HTML strings are included.
	const hasShortcodes = pieces.length > 1;

	// True if mode is auto, no shortcode is included and HTML verifies the isInlineContent condition
	const isAutoModeInline = mode === 'AUTO' && isInlineContent( HTML, tagName ) && ! hasShortcodes;

	// Return filtered HTML if condition is true
	if ( mode === 'INLINE' || isAutoModeInline ) {
		HTML = deepFilterHTML( HTML, [
			// Add semantic formatting before attributes are stripped.
			formattingTransformer,
			stripAttributes,
			commentRemover,
			createUnwrapper( ( node ) => ! isInline( node, tagName ) ),
		] );

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Processed inline HTML:\n\n', HTML );

		return HTML;
	}

	// Before we parse any HTML, extract shorcodes so they don't get messed up.
	return pieces.reduce( ( accu, piece ) => {
		// Already a block from shortcode.
		if ( typeof piece !== 'string' ) {
			return [ ...accu, piece ];
		}

		// Context dependent filters. Needs to run before we remove nodes.
		piece = deepFilterHTML( piece, [
			msListConverter,
		] );

		piece = deepFilterHTML( piece, compact( [
			listReducer,
			imageCorrector,
			// Add semantic formatting before attributes are stripped.
			formattingTransformer,
			stripAttributes,
			commentRemover,
			! canUserUseUnfilteredHTML && createUnwrapper( ( element ) => element.nodeName === 'IFRAME' ),
			embeddedContentReducer,
			createUnwrapper( isNotWhitelisted ),
			blockquoteNormaliser,
			tableNormaliser,
			inlineContentConverter,
		] ) );

		piece = deepFilterHTML( piece, [
			createUnwrapper( isInvalidInline ),
		] );

		piece = normaliseBlocks( piece );

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Processed HTML piece:\n\n', piece );

		const doc = document.implementation.createHTMLDocument( '' );

		doc.body.innerHTML = piece;

		const blocks = Array.from( doc.body.children ).map( ( node ) => {
			const block = getBlockTypes().reduce( ( acc, blockType ) => {
				if ( acc ) {
					return acc;
				}

				const transformsFrom = get( blockType, 'transforms.from', [] );
				const transform = find( transformsFrom, ( { type } ) => type === 'raw' );

				if ( ! transform || ! transform.isMatch( node ) ) {
					return acc;
				}

				if ( transform.transform ) {
					return transform.transform( node );
				}

				return createBlock(
					blockType.name,
					getBlockAttributes(
						blockType,
						node.outerHTML
					)
				);
			}, null );

			if ( block ) {
				return block;
			}

			return createBlock( getUnknownTypeHandlerName(), {
				content: node.outerHTML,
			} );
		} );

		return [ ...accu, ...blocks ];
	}, [] );
}
