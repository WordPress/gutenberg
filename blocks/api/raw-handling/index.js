/**
 * External dependencies
 */
import { find, get } from 'lodash';
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
import listMerger from './list-merger';
import imageCorrector from './image-corrector';
import blockquoteNormaliser from './blockquote-normaliser';
import tableNormaliser from './table-normaliser';
import inlineContentConverter from './inline-content-converter';
import { deepFilterHTML, isInvalidInline, isNotWhitelisted, isPlain, isInline } from './utils';
import shortcodeConverter from './shortcode-converter';

/**
 * Converts an HTML string to known blocks. Strips everything else.
 *
 * @param  {String}       options.HTML        The HTML to convert.
 * @param  {String}       [options.plainText] Plain text version.
 * @param  {String}       [options.mode]      Handle content as blocks or inline content.
 *                                            * 'AUTO': Decide based on the content passed.
 *                                            * 'INLINE': Always handle as inline content, and return string.
 *                                            * 'BLOCKS': Always handle as blocks, and return array of blocks.
 * @param  {Array}         [options.tagName]  The tag into which content will be inserted.
 * @return {Array|String}                     A list of blocks or a string, depending on `handlerMode`.
 */
export default function rawHandler( { HTML, plainText = '', mode = 'AUTO', tagName } ) {
	// First of all, strip any meta tags.
	HTML = HTML.replace( /<meta[^>]+>/, '' );

	// If we detect block delimiters, parse entirely as blocks.
	if ( mode !== 'INLINE' && HTML.indexOf( '<!-- wp:' ) !== -1 ) {
		return parseWithGrammar( HTML );
	}

	// If there is a plain text version, the HTML version has no formatting,
	// and there is at least a double line break,
	// parse any Markdown inside the plain text.
	if ( plainText && isPlain( HTML ) && plainText.indexOf( '\n\n' ) !== -1 ) {
		const converter = new showdown.Converter();

		converter.setOption( 'noHeaderId', true );
		converter.setOption( 'tables', true );

		HTML = converter.makeHtml( plainText );
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

		piece = deepFilterHTML( piece, [
			listMerger,
			imageCorrector,
			// Add semantic formatting before attributes are stripped.
			formattingTransformer,
			stripAttributes,
			commentRemover,
			createUnwrapper( isNotWhitelisted ),
			blockquoteNormaliser,
			tableNormaliser,
			inlineContentConverter,
		] );

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
