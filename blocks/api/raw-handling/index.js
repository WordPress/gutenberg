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
 * @param  {?Boolean}     [options.inline]    Whether to content should be inline or not. Null to auto-detect, false to force blocks, true to force a string.
 * @return {Array|String}                     A list of blocks or a string, depending on the `inline` option.
 */
export default function rawHandler( { HTML, plainText = '', inline = null } ) {
	// First of all, strip any meta tags.
	HTML = HTML.replace( /<meta[^>]+>/, '' );

	// If we detect block delimiters, parse entirely as blocks.
	if ( ! inline && HTML.indexOf( '<!-- wp:' ) !== -1 ) {
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

	// Return filtered HTML if it's inline paste or all content is inline.
	if ( inline || ( inline === null && isInlineContent( HTML ) ) ) {
		HTML = deepFilterHTML( HTML, [
			// Add semantic formatting before attributes are stripped.
			formattingTransformer,
			stripAttributes,
			commentRemover,
			createUnwrapper( ( node ) => ! isInline( node ) ),
		] );

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Processed inline HTML:\n\n', HTML );

		return HTML;
	}

	// Before we parse any HTML, extract shorcodes so they don't get messed up.
	return shortcodeConverter( HTML ).reduce( ( accu, piece ) => {
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
