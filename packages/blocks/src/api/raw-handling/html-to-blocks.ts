/**
 * Internal dependencies
 */
import { createBlock, findTransform } from '../factory';
import { getBlockAttributes } from '../parser/get-block-attributes';
import { getRawTransforms } from './get-raw-transforms';
import type { Block } from '../../types';

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
export function htmlToBlocks(
	html: string,
	handler: ( options: { HTML: string } ) => Block[] | string
): Block[] {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = html;

	return Array.from( doc.body.children ).flatMap( ( node ) => {
		const transforms = getRawTransforms();
		const rawTransform = findTransform(
			transforms as unknown as Parameters< typeof findTransform >[ 0 ],
			( ( t: unknown ) => {
				const transform = t as ( typeof transforms )[ number ];
				return transform.isMatch( node );
			} ) as Parameters< typeof findTransform >[ 1 ]
		) as unknown as ( typeof transforms )[ number ] | null;

		if ( ! rawTransform ) {
			return createBlock(
				// Should not be hardcoded.
				'core/html',
				getBlockAttributes( 'core/html', node.outerHTML )
			);
		}

		const { transform, blockName } = rawTransform;

		if ( transform ) {
			const block = transform( node, handler ) as Block;
			if ( node.hasAttribute( 'class' ) ) {
				block.attributes.className = node.getAttribute( 'class' );
			}
			return block;
		}

		return createBlock(
			blockName!,
			getBlockAttributes( blockName!, node.outerHTML )
		);
	} );
}
