/**
 * Internal dependencies
 */
import { textContentAreas } from './text-content-areas';

/**
 * Tabs through the text content areas of a block and asserts the expected values
 *
 * @param {string} content The expected value of the block's contenteditable elements
 * @return {Promise} A promise that's resolved when the browser has finished tabbing throught the contenteditable areas of a block, and asserting they have keyboard focus and the expected content.
 */

export async function tabThroughTextContentAreas( content ) {
	const blocks = await textContentAreas( { empty: false } );

	for ( let i = 0; i < blocks.length; i++ ) {
		if ( i > 0 ) {
			await page.keyboard.press( 'Tab' );
		}
		const isFocusedTextContentArea = await page.evaluate( () => document.activeElement.contentEditable );
		const textContentAreaContent = await page.evaluate( () => document.activeElement.innerHTML );

		// The value of 'contentEditable' should be the string 'true'
		expect( isFocusedTextContentArea ).toBe( 'true' );
		expect( textContentAreaContent ).toContain( content );
	}
}
