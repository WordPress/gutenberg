/**
 * WordPress dependencies
 */
import {
	createNewPost,
	clickBlockAppender,
	clickBlockToolbarButton,
} from '@wordpress/e2e-test-utils';

describe( 'invalid blocks', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Should show an invalid block message with clickable options', async () => {
		// Create an empty paragraph with the focus in the block
		await clickBlockAppender();
		await page.keyboard.type( 'hello' );

		await clickBlockToolbarButton( 'More options' );

		// Change to HTML mode and close the options
		const changeModeButton = await page.waitForXPath( '//button[text()="Edit as HTML"]' );
		await changeModeButton.click();

		// Focus on the textarea and enter an invalid paragraph
		await page.click( '.block-editor-block-list__layout .block-editor-block-list__block .block-editor-block-list__block-html-textarea' );
		await page.keyboard.type( '<p>invalid paragraph' );

		// Takes the focus away from the block so the invalid warning is triggered
		await page.click( '.editor-post-save-draft' );
		expect( console ).toHaveErrored();
		expect( console ).toHaveWarned();

		// Click on the 'resolve' button
		await page.click( '.block-editor-warning__actions button' );

		// Check we get the resolve modal with the appropriate contents
		const htmlBlockContent = await page.$eval( '.block-editor-block-compare__html', ( node ) => node.textContent );
		expect( htmlBlockContent ).toEqual( '<p>hello</p><p>invalid paragraph' );
	} );
} );
