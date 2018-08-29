/**
 * Internal dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	newPost,
	pressWithModifier,
	META_KEY,
} from '../support/utils';

describe( 'Formatting Controls', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'Should apply the formatting controls', async () => {
		// Creating a paragraph block with some content
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "bold"' );

		// Selecting some text
		await page.keyboard.down( 'Shift' );
		for ( let i = 1; i <= 6; i++ ) {
			await page.keyboard.press( 'ArrowLeft' );
		}
		await page.keyboard.up( 'Shift' );

		// Applying "bold"
		await pressWithModifier( META_KEY, 'b' );

		// Check content
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );
} );
