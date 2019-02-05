/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	findSidebarPanelWithTitle,
	insertBlock,
	openDocumentSettingsSidebar,
	publishPost,
} from '@wordpress/e2e-test-utils';

describe( 'Meta boxes', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-plugin-meta-box' );
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-meta-box' );
	} );

	it( 'Should save the post', async () => {
		// Save should not be an option for new empty post.
		expect( await page.$( '.editor-post-save-draft' ) ).toBe( null );

		// Add title to enable valid non-empty post save.
		await page.type( '.editor-post-title__input', 'Hello Meta' );
		expect( await page.$( '.editor-post-save-draft' ) ).not.toBe( null );

		await Promise.all( [
			// Transitions between three states "Saving..." -> "Saved" -> "Save
			// Draft" (the button is always visible while meta are present).
			page.waitForSelector( '.editor-post-saved-state.is-saving' ),
			page.waitForSelector( '.editor-post-saved-state.is-saved' ),
			page.waitForSelector( '.editor-post-save-draft' ),

			// Keyboard shortcut Ctrl+S save.
			page.keyboard.down( 'Meta' ),
			page.keyboard.press( 'S' ),
			page.keyboard.up( 'Meta' ),
		] );
	} );

	it( 'Should render dynamic blocks when the meta box uses the excerpt for front end rendering', async () => {
		// Publish a post so there's something for the latest posts dynamic block to render.
		await createNewPost();
		await page.type( '.editor-post-title__input', 'A published post' );
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Hello there!' );
		await publishPost();

		// Publish a post with the latest posts dynamic block.
		await createNewPost();
		await page.type( '.editor-post-title__input', 'Dynamic block test' );
		await insertBlock( 'Latest Posts' );
		await publishPost();

		// View the post.
		const viewPostLinks = await page.$x( "//a[contains(text(), 'View Post')]" );
		await viewPostLinks[ 0 ].click();
		await page.waitForNavigation();

		// Check the the dynamic block appears.
		await page.waitForSelector( '.wp-block-latest-posts' );
	} );

	it( 'Should render the excerpt in meta based on post content if no explicit excerpt exists', async () => {
		await createNewPost();
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Excerpt from content.' );
		await page.type( '.editor-post-title__input', 'A published post' );
		await publishPost();

		// View the post.
		const viewPostLinks = await page.$x( "//a[contains(text(), 'View Post')]" );
		await viewPostLinks[ 0 ].click();
		await page.waitForNavigation();

		// Retrieve the excerpt used as meta
		const metaExcerpt = await page.evaluate( () => {
			return document.querySelector(
				'meta[property="gutenberg:hello"]'
			).getAttribute(
				'content'
			);
		} );

		expect( metaExcerpt ).toEqual( 'Excerpt from content.' );
	} );

	it( 'Should render the explicitly set excerpt in meta instead of the content based one', async () => {
		await createNewPost();
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Excerpt from content.' );
		await page.type( '.editor-post-title__input', 'A published post' );

		// Open the excerpt panel
		await openDocumentSettingsSidebar();
		const excerptButton = await findSidebarPanelWithTitle( 'Excerpt' );
		if ( excerptButton ) {
			await excerptButton.click( 'button' );
		}

		await page.waitForSelector( '.editor-post-excerpt textarea' );

		await page.type( '.editor-post-excerpt textarea', 'Explicitly set excerpt.' );

		await publishPost();

		// View the post.
		const viewPostLinks = await page.$x( "//a[contains(text(), 'View Post')]" );
		await viewPostLinks[ 0 ].click();
		await page.waitForNavigation();

		// Retrieve the excerpt used as meta
		const metaExcerpt = await page.evaluate( () => {
			return document.querySelector(
				'meta[property="gutenberg:hello"]'
			).getAttribute(
				'content'
			);
		} );

		expect( metaExcerpt ).toEqual( 'Explicitly set excerpt.' );
	} );
} );
