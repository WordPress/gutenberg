/**
 * WordPress dependencies
 */
import {
	insertBlock,
	textContentAreas,
} from '@wordpress/e2e-test-utils';

/**
 * Inserts a content block and then, if it has text content areas, fills them with text
 *
 * @param {string} blockName The type of block to insert
 * @param {string} content  The text to enter into each contenteditable area
 * @return {Promise} A promise that resolves when all the blocks are inserted and filled with content.
 */
export async function insertAndPopulateBlock( blockName, content ) {
	await insertBlock( blockName );
	// typing populates the first content area
	await page.keyboard.type( content );

	// if there are more contenteditable elements, select and populate them too:
	const blocks = await textContentAreas( { empty: true } );

	for ( let i = 0; i < blocks.length; i++ ) {
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( content );
	}
	await page.keyboard.press( 'Enter' );
}
