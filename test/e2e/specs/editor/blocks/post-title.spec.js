/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post Title block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Can edit the post title', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/post-title' } );

		// Add the post title
		await editor.canvas
			.getByRole( 'textbox', {
				name: 'Add title',
			} )
			.fill( 'Just tweaking the post title' );

		// Save the post draft and reload.
		await editor.saveDraft();
		await page.reload();

		const titleBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Title',
		} );
		await expect( titleBlock ).toBeVisible();
		await expect( titleBlock ).toHaveText( 'Just tweaking the post title' );
	} );
} );
