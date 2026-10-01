import { createBlock, findTransform } from '../factory';
import { getBlockAttributes } from '../parser/get-block-attributes';
import { getRawTransforms } from './get-raw-transforms';
import type { Block, RawHandler } from '../../types';

/**
 * Converts HTML directly to blocks. Looks for a matching transform for each
 * top-level tag. The HTML should be filtered to not have any text between
 * top-level tags and formatted in a way that blocks can handle the HTML.
 *
 * @param html    HTML to convert.
 * @param handler The handler calling htmlToBlocks: either rawHandler
 *                or pasteHandler.
 *
 * @return An array of blocks.
 */
export function htmlToBlocks( html: string, handler: RawHandler ): Block[] {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = html;

	return Array.from( doc.body.children ).flatMap( ( node ) => {
		const transforms = getRawTransforms();
		const rawTransform = findTransform( transforms, ( transform ) =>
			transform.isMatch( node )
		);

		if ( ! rawTransform ) {
			return createBlock(
				// Should not be hardcoded.
				'core/html',
				{},
				[],
				[ node.outerHTML ]
			);
		}

		const { transform, blockName } = rawTransform;

		if ( transform ) {
			// A raw transform may return several blocks, in which case it is
			// unclear which of them the node's class belongs on, so only the
			// single-block case is handled. No core raw transform returns an
			// array today; one that did would already have thrown here.
			const block = transform( node, handler ) as Block;
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
