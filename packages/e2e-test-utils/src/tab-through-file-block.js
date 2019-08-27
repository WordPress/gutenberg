
/**
 * Internal dependencies
 */

import { tabThroughBlockControls } from './tab-through-block-controls';
import { tabThroughPlaceholderButtons } from './tab-through-placeholder-buttons';

/**
 * Tabs through a content block with file upload buttons, such as an Image, Gallery, Audio, or Cover block
 *
 * @param {string} blockType  The expected value of the data-type attribute of the block's external wrapper
 * @return {Promise} A promise that resolves when the browser has completed tabbing through the common block components, and the placeholder buttons that are unique to blocks with file-upload features.
 */
export async function tabThroughFileBlock( blockType ) {
	await tabThroughBlockControls( blockType );
	await tabThroughPlaceholderButtons();
}
