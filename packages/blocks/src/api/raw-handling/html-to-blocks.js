/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { createBlock, findTransform } from '../factory';
import parse from '../parser';
import { getBlockAttributes } from '../parser/get-block-attributes';
import { getRawTransforms } from './get-raw-transforms';

/**
 * Converts HTML directly to blocks. Looks for a matching transform for each
 * top-level tag. The HTML should be filtered to not have any text between
 * top-level tags and formatted in a way that blocks can handle the HTML.
 *
 * @param {string}   html    HTML to convert.
 * @param {Function} handler The handler calling htmlToBlocks: either rawHandler
 *                           or pasteHandler.
 *
 * @return {Array} An array of blocks.
 */
export function htmlToBlocks( html, handler ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = html;

	return Array.from( doc.body.children ).flatMap( ( node ) => {
		const rawTransform = findTransform(
			getRawTransforms(),
			( { isMatch } ) => isMatch( node )
		);

		if ( ! rawTransform ) {
			// Until the HTML block is supported in the native version, we'll parse it
			// instead of creating the block to generate it as an unsupported block.
			if ( Platform.isNative ) {
				return parse(
					`<!-- wp:html -->${ node.outerHTML }<!-- /wp:html -->`
				);
			}
			return createBlock(
				// Should not be hardcoded.
				'core/html',
				getBlockAttributes( 'core/html', node.outerHTML )
			);
		}

		const { transform, blockName } = rawTransform;

		if ( transform ) {
			const block = transform( node, handler );
			if ( node.hasAttribute( 'class' ) ) {
				block.attributes.className = node.getAttribute( 'class' );
			}
			return block;
		}

		return createBlock(
			blockName,
			getBlockAttributes( blockName, node.outerHTML )
		);
	} );
}
