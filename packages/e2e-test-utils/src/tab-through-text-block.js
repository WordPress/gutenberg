/**
 * Internal dependencies
 */
import { tabThroughBlock } from './tab-through-block';
import { textContentAreasHaveFocus } from './text-content-areas-have-focus';

/**
 * Tabs through a content block with text content areas, such as a Heading, Quote, or Paragraph block. Asserts that the text content areas all receive focus.
 *
 * @param {string} content The expected title of the block
 * @param {string} blockType  The expected value of the data-type attribute of the block's external wrapper
 */

export async function tabThroughTextBlock( content, blockType ) {
	await tabThroughBlock( content, blockType );

	// Tab causes the block text content to receive focus
	await page.keyboard.press( 'Tab' );
	await textContentAreasHaveFocus( content );
}
