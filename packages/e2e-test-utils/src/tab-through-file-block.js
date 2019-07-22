
/**
 * Internal dependencies
 */

import { tabThroughBlock } from './tab-through-block';
import { tabThroughPlaceholderButtons } from './tab-through-placeholder-buttons';

/**
 * Tabs through a content block with file upload buttons, such as an Image, Gallery, Audio, or Cover block
 *
 * @param {string} blockType  The expected value of the data-type attribute of the block's external wrapper
 */
export async function tabThroughFileBlock( blockType ) {
	await tabThroughBlock( blockType );
	await tabThroughPlaceholderButtons();
}
