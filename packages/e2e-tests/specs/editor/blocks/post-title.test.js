/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	saveDraft,
	canvas,
} from '@wordpress/e2e-test-utils';

describe( 'Post Title block', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Can edit the post title', async () => {
		// Create a block with some text that will trigger a list creation.
		await insertBlock( 'Title' );
		const editablePostTitleSelector =
			'.wp-block-post-title[contenteditable="true"]';
		await canvas().waitForSelector( editablePostTitleSelector );
		await canvas().focus( editablePostTitleSelector );

		// Create a second list item.
		await page.keyboard.type( 'Just tweaking the post title' );

		await saveDraft();
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );
		const title = await canvas().$eval(
			'.editor-post-title__input',
			( element ) => element.textContent
		);
		expect( title ).toEqual( 'Just tweaking the post title' );
	} );
} );
