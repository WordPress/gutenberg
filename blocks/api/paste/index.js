/**
 * External dependencies
 */
import { find, get } from 'lodash';

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
import showdown from 'showdown';

export default function( { HTML, plainText, inline } ) {
	HTML = HTML.replace( /<meta[^>]+>/, '' );

	// Block delimiters detected.
	if ( ! inline && HTML.indexOf( '<!-- wp:' ) !== -1 ) {
		return parseWithGrammar( HTML );
	}

	if ( plainText && isPlain( HTML ) && plainText.indexOf( '\n\n' ) !== -1 ) {
		const converter = new showdown.Converter();

		converter.setOption( 'noHeaderId', true );
		converter.setOption( 'tables', true );

		HTML = converter.makeHtml( plainText );
	} else {
		// Context dependent filters. Needs to run before we remove nodes.
		HTML = deepFilterHTML( HTML, [
			msListConverter,
		] );
	}

	HTML = deepFilterHTML( HTML, [
		listMerger,
		imageCorrector,
		// Add semantic formatting before attributes are stripped.
		formattingTransformer,
		stripAttributes,
		commentRemover,
		createUnwrapper( ( node ) => isNotWhitelisted( node ) || ( inline && ! isInline( node ) ) ),
		blockquoteNormaliser,
		tableNormaliser,
		inlineContentConverter,
	] );

	// Inline paste.
	if ( inline || isInlineContent( HTML ) ) {
		// Allows us to ask for this information when we get a report.
		window.console.log( 'Processed inline HTML:\n\n', HTML );

		return HTML;
	}

	HTML = deepFilterHTML( HTML, [
		createUnwrapper( isInvalidInline ),
	] );

	HTML = normaliseBlocks( HTML );

	// Allows us to ask for this information when we get a report.
	window.console.log( 'Processed HTML piece:\n\n', HTML );

	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	return Array.from( doc.body.children ).map( ( node ) => {
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
}
