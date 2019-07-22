/**
 * Internal dependencies
 */
import { textContentAreas } from './text-content-areas';

/**
 * Tabs through the text content areas of a block and asserts the expected values
 *
 * @param {string} content The expected value of the block's contenteditable elements
 */

export async function textContentAreasHaveFocus( content ) {
	const blocks = await textContentAreas( { empty: false } );
	const isFocusedTextContentArea = await page.evaluate( () => document.activeElement.contentEditable );
	const textContentAreaContent = await page.evaluate( () => document.activeElement.innerHTML );

	for ( let i = 0; i < blocks.length; i++ ) {
		if ( i > 0 ) {
			await page.keyboard.press( 'Tab' );
		}

		// The value of 'contentEditable' should be the string 'true'
		await expect( isFocusedTextContentArea ).toBe( 'true' );
		await expect( textContentAreaContent ).toContain( content );
	}
}
