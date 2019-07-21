/**
 * Internal dependencies
 */
import { tabThroughBlock } from './tab-through-block';
import { tabThroughPlaceholderButtons } from './tab-through-placeholder-buttons';

export async function tabThroughFileBlock( content, blockType ) {
	await tabThroughBlock( content, blockType );
	await tabThroughPlaceholderButtons();
}
