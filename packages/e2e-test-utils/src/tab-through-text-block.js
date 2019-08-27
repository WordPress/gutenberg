/**
 * Internal dependencies
 */
import { tabThroughBlockControls } from './tab-through-block-controls';
import { textContentAreasHaveFocus } from './text-content-areas-have-focus';

/**
 * Tabs through a content block with text content areas, such as a Heading, Quote, or Paragraph block. Asserts that the text content areas all receive focus.
 *
 * @param {string} blockType  The expected value of the data-type attribute of the block's external wrapper
 * @param {string} content The expected title of the block
 * @return {Promise} A promise that resolves when the browser has completed tabbing through the focusable elements of a common block, and through the contenteditbable areas unique to text blocks.
 */

export async function tabThroughTextBlock( blockType, content ) {
	await tabThroughBlockControls( blockType );

	// Tab causes the block text content to receive focus
	await page.keyboard.press( 'Tab' );
	await textContentAreasHaveFocus( content );
}
