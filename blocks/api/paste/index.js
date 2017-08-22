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
import createUnwrapper from './create-unwrapper';
import isInlineContent from './is-inline-content';
import { deepFilter, isInline, isSpan, isWrapper } from './utils';

export default function( { content: HTML, inline } ) {
	HTML = HTML.replace( /<meta[^>]+>/, '' );

	// Block delimiters detected.
	if ( ! inline && HTML.indexOf( '<!-- wp:' ) !== -1 ) {
		return parseWithGrammar( HTML );
	}

	// Inline paste.
	if ( inline || isInlineContent( HTML ) ) {
		HTML = deepFilter( HTML, [
			stripAttributes,
			createUnwrapper( ( node ) => ! isInline( node ) ),
			createUnwrapper( ( node ) => isSpan( node ) ),
		] );

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Processed inline HTML:\n\n', HTML );

		return HTML;
	}

	HTML = deepFilter( HTML, [
		stripAttributes,
		createUnwrapper( ( node ) => isWrapper( node ) ),
		createUnwrapper( ( node ) => isSpan( node ) ),
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
