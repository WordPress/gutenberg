/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Test and Verify Post title block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'Edit Post title and verify', async ( { page, editor } ) => {
		// Add a new block
		await editor.insertBlock( { name: 'core/post-title' } );

		const PostTitle = 'Modifying Post title';

		// Add the post title
		await page.type( 'role=textbox[name*="Add title"i]', PostTitle );

		// Saving Post as Draft
		await page.locator( 'role=button[name="Save draft"i]' ).click();

		// Verfy Notice
		await page.waitForSelector(
			'role=button[name="Dismiss this notice"i]'
		);

		await page.reload();

		const title = page.locator( '.editor-post-title__input' );

		// Verify Post title
		await expect( title ).toHaveText( PostTitle );
	} );
} );
