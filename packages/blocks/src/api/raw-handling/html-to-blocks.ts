import { createBlock, findTransform } from '../factory';
import { applyBuiltInValidationFixes } from '../parser/apply-built-in-validation-fixes';
import { getBlockAttributes } from '../parser/get-block-attributes';
import { getBlockType } from '../registration';
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
		let block: Block;

		if ( transform ) {
			// A raw transform may return several blocks, in which case it is
			// unclear which of them the node's attributes belong on, so only
			// the single-block case is handled. No core raw transform returns
			// an array today; one that did would already have thrown here.
			block = transform( node, handler ) as Block;
		} else {
			block = createBlock(
				blockName,
				getBlockAttributes( blockName, node.outerHTML )
			);
		}

		// A block support usually declares its attribute without a source, so
		// `getBlockAttributes` cannot read it out of the markup. Recover
		// those with the fixes the parser applies to an invalid block.
		const { originalContent, ...fixedBlock } = applyBuiltInValidationFixes(
			{ ...block, originalContent: node.outerHTML },
			getBlockType( block.name )!
		);
		return fixedBlock;
	} );
}
