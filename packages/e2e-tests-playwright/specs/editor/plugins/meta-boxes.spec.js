/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Meta boxes', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-plugin-meta-box' );
	} );

	test.beforeEach( async ( { pageUtils } ) => {
		pageUtils.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-plugin-meta-box' );
	} );

	test( 'Should save the post', async ( { page, pageUtils } ) => {
		// Save should not be an option for new empty post.
		await expect( page.locator( '.editor-post-save-draft' ) ).toBeHidden();

		// Add title to enable valid non-empty post save.
		await page.type( '.editor-post-title__input', 'Hello Meta' );
		await expect( page.locator( '.editor-post-save-draft' ) ).toBeVisible();

		await pageUtils.saveDraft();

		// After saving, affirm that the button returns to Save Draft.
		await page.waitForSelector( '.editor-post-save-draft' );
	} );

	test( 'Should render dynamic blocks when the meta box uses the excerpt for front end rendering', async ( {
		page,
		pageUtils,
	} ) => {
		// Publish a post so there's something for the latest posts dynamic block to render.
		await page.type( '.editor-post-title__input', 'A published post' );
		await pageUtils.insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Hello there!' );
		await pageUtils.publishPost();

		// Publish a post with the latest posts dynamic block.
		await pageUtils.createNewPost();
		await page.type( '.editor-post-title__input', 'Dynamic block test' );
		await pageUtils.insertBlock( 'Latest Posts' );
		await pageUtils.publishPost();

		// View the post.
		const viewPostLinks = page.locator(
			'.components-snackbar a:has-text("View Post")'
		);
		await viewPostLinks.click();

		// Check the the dynamic block appears.
		const latestPostsBlock = page.locator(
			'.entry-content .wp-block-latest-posts'
		);

		await expect( latestPostsBlock ).toContainText( 'A published post' );
		await expect( latestPostsBlock ).toContainText( 'Dynamic block test' );
	} );

	test( 'Should render the excerpt in meta based on post content if no explicit excerpt exists', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Excerpt from content.' );
		await page.type( '.editor-post-title__input', 'A published post' );
		await pageUtils.publishPost();

		// View the post.
		const viewPostLinks = page.locator(
			'.components-snackbar a:has-text("View Post")'
		);
		await viewPostLinks.click();

		// Retrieve the excerpt used as meta.
		const metaExcerpt = await page.evaluate( () => {
			return document
				.querySelector( 'meta[property="gutenberg:hello"]' )
				.getAttribute( 'content' );
		} );

		expect( metaExcerpt ).toEqual( 'Excerpt from content.' );
	} );

	test( 'Should render the explicitly set excerpt in meta instead of the content based one', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Excerpt from content.' );
		await page.type( '.editor-post-title__input', 'A published post' );

		// Open the excerpt panel.
		await pageUtils.openDocumentSettingsSidebar();
		const excerptButton = await pageUtils.findSidebarPanelToggleButtonWithTitle(
			'Excerpt'
		);
		await excerptButton.click( 'button' );

		await page.waitForSelector( '.editor-post-excerpt textarea' );

		await page.type(
			'.editor-post-excerpt textarea',
			'Explicitly set excerpt.'
		);

		await pageUtils.publishPost();

		// View the post.
		const viewPostLinks = page.locator(
			'.components-snackbar a:has-text("View Post")'
		);
		await viewPostLinks.click();

		// Retrieve the excerpt used as meta.
		const metaExcerpt = await page.evaluate( () => {
			return document
				.querySelector( 'meta[property="gutenberg:hello"]' )
				.getAttribute( 'content' );
		} );

		expect( metaExcerpt ).toEqual( 'Explicitly set excerpt.' );
	} );
} );
