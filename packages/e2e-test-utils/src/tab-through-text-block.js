/**
 * Internal dependencies
 */
import { tabThroughBlock } from './tab-through-block';
import { textContentAreasHaveFocus } from './text-content-areas-have-focus';

export async function tabThroughTextBlock( content, blockType ) {
	await tabThroughBlock( content, blockType );

	// Tab causes the block text content to receive focus
	await page.keyboard.press( 'Tab' );
	await textContentAreasHaveFocus( content );
}
