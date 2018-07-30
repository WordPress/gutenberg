/**
 * Internal dependencies
 */
import { newPost, pressWithModifier, getEditedPostContent } from '../support/utils';

describe.skip( 'Formatting Controls', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'Should apply the formatting controls', async () => {
		// Creating a paragraph block with some content
		await page.click( '.editor-default-block-appender' );
		await page.keyboard.type( 'Paragraph to be made "bold"' );

		// Selecting some text
		await page.keyboard.down( 'Shift' );
		for ( let i = 1; i <= 6; i++ ) {
			await page.keyboard.press( 'ArrowLeft' );
		}
		await page.keyboard.up( 'Shift' );

		// Applying "bold"
		await pressWithModifier( 'Mod', 'b' );

		// Check content
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );
} );
