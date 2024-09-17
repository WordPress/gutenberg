/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Meta boxes', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-plugin-meta-box' );
		await requestUtils.deleteAllPosts();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-plugin-meta-box' );
	} );

	test( 'Should save the post', async ( { editor, page } ) => {
		const saveDraft = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save draft' } );

		// Save should not be an option for new empty post.
		await expect( saveDraft ).toBeDisabled();

		// Add title to enable valid non-empty post save.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello Meta' );

		await expect( saveDraft ).toBeEnabled();

		await editor.saveDraft();

		// After saving, affirm that the button returns to Save Draft.
		await expect( saveDraft ).toBeEnabled();
	} );

	test( 'Should render dynamic blocks when the meta box uses the excerpt for front end rendering', async ( {
		admin,
		editor,
		page,
	} ) => {
		// Publish a post so there's something for the latest posts dynamic block to render.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'A published post' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Hello there!' );
		await editor.publishPost();

		// Publish a post with the latest posts dynamic block.
		await admin.createNewPost();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Dynamic block test' );
		await editor.insertBlock( { name: 'core/latest-posts' } );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await expect(
			page.locator( '.entry-content .wp-block-latest-posts__post-title' )
		).toContainText( [ 'Dynamic block test', 'A published post' ] );
	} );

	test( 'Should render the excerpt in meta based on post content if no explicit excerpt exists', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'A published post' );
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Excerpt from content.' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await expect(
			page.locator( 'meta[property="gutenberg:hello"]' )
		).toHaveAttribute( 'content', 'Excerpt from content.' );
	} );

	test( 'Should render the explicitly set excerpt in meta instead of the content based one', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Excerpt from content.' );
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'A published post' );

		const excerptButton = page.getByRole( 'button', {
			name: 'Add an excerpt…',
		} );
		await excerptButton.click();

		await page
			.getByRole( 'textbox', { name: 'Write an Excerpt' } )
			.fill( 'Explicitly set excerpt.' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await expect(
			page.locator( 'meta[property="gutenberg:hello"]' )
		).toHaveAttribute( 'content', 'Explicitly set excerpt.' );
	} );
} );
