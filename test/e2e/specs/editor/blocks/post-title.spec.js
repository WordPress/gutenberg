/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post Title block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Can edit the post title', async ( { editor, page } ) => {
		// Create a block with some text that will trigger a list creation.
		await editor.insertBlock( { name: 'core/post-title' } );

		// Add the post title
		await page.locator( 'role=textbox[name="Add title"i]' ).focus();
		await page.type(
			'role=textbox[name="Add title"i]',
			'Just tweaking the post title'
		);

		// Save the post draft and reload.
		await page.click( 'role=button[name="Save draft"i]' );
		await page.waitForSelector(
			'role=button[name="Dismiss this notice"i]'
		);
		await page.reload();

		const titleBlock = page.locator( '[data-type="core/post-title"]' );

		await expect( titleBlock ).toHaveText( 'Just tweaking the post title' );
	} );
} );
