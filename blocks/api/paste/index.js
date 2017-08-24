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
import imageCorrector from './image-corrector';
import { deepFilter, isInline, isSpan, isWrapper, isInvalidInline } from './utils';

export default function( { content: HTML, inline } ) {
	HTML = HTML.replace( /<meta[^>]+>/, '' );

	// Block delimiters detected.
	if ( ! inline && HTML.indexOf( '<!-- wp:' ) !== -1 ) {
		return parseWithGrammar( HTML );
	}

	HTML = deepFilter( HTML, [
		createUnwrapper( ( node ) => isInvalidInline( node ) ),
	] );

	// Inline paste.
	if ( inline || isInlineContent( HTML ) ) {
		HTML = deepFilter( HTML, [
			formattingTransformer,
			stripAttributes,
			commentRemover,
			createUnwrapper( ( node ) => ! isInline( node ) ),
			createUnwrapper( ( node ) => isSpan( node ) ),
			createUnwrapper( ( node ) => node.nodeName === 'O:P' ),
		] );

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Processed inline HTML:\n\n', HTML );

		return HTML;
	}

	// Context dependent filters. Needs to run before we remove tags.
	HTML = deepFilter( HTML, [
		msListConverter,
	] );

	HTML = deepFilter( HTML, [
		formattingTransformer,
		stripAttributes,
		commentRemover,
		imageCorrector,
		createUnwrapper( ( node ) => isWrapper( node ) ),
		createUnwrapper( ( node ) => isSpan( node ) ),
		createUnwrapper( ( node ) => node.nodeName === 'O:P' ),
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
