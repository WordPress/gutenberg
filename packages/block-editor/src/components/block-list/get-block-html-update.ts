import {
	getBlockAttributes,
	getBlockType,
	getSaveContent,
	validateBlock,
} from '@wordpress/blocks';
import type { TreeBlock } from '../../store/types';

/**
 * Returns the update that commits HTML edited as the block's markup: the
 * attributes parsed from it, the HTML as the block's original content, and
 * whether the block is valid. Empty HTML resets the block to the content its
 * current attributes save.
 *
 * @param block Block whose HTML was edited.
 * @param html  Edited HTML.
 *
 * @return The block update, or `undefined` if the block type isn't registered.
 */
export default function getBlockHTMLUpdate( block: TreeBlock, html: string ) {
	const blockType = getBlockType( block.name );

	if ( ! blockType ) {
		return undefined;
	}

	const attributes = getBlockAttributes( blockType, html, block.attributes );

	// If html is empty  we reset the block to the default HTML and mark it as valid to avoid triggering an error
	const content = html ? html : getSaveContent( blockType, attributes );
	const [ isValid ] = html
		? validateBlock( {
				...block,
				attributes,
				originalContent: content,
			} )
		: [ true ];

	return { attributes, originalContent: content, isValid };
}
