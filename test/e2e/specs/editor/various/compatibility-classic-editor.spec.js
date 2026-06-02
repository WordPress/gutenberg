/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Compatibility with classic editor', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'Should not apply auto when rendering blocks', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/html' } );
		await editor.canvas
			.getByRole( 'button', { name: 'Edit HTML' } )
			.click();
		await page.getByRole( 'dialog' ).getByRole( 'textbox' ).click();
		await page.keyboard.type( '<a>' );
		await page.keyboard.type( 'Random Link' );
		await page.keyboard.type( '</a> ' );
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Update' } )
			.click();
		// Publish Post
		const postId = await editor.publishPost();
		// View Post
		await page.goto( `/?p=${ postId }` );

		// Check the content doesn't contain <p> tags.
		// No accessible selector for now.
		const content = page.locator( '.entry-content' );
		await expect
			.poll( () => content.innerHTML() )
			.toContain( `<a>Random Link</a>` );
	} );
} );
