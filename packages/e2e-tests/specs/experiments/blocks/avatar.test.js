/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	getEditedPostContent,
	insertBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Avatar block', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be inserted', async () => {
		// Create a block with some text that will trigger a list creation.
		await insertBlock( 'Avatar' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by typing "/avatar"', async () => {
		// Create a list with the slash block shortcut.
		await clickBlockAppender();
		await page.keyboard.type( '/avatar' );
		await page.waitForXPath(
			`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'Avatar')]`
		);
		await page.keyboard.press( 'Enter' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
