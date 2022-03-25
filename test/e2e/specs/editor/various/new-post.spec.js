/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'new editor state', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-post-formats-support'
		);
	} );

	test.beforeEach( async ( { pageUtils } ) => {
		await pageUtils.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-post-formats-support'
		);
	} );

	test( 'should show the New Post page in Gutenberg', async ( { page } ) => {
		expect( page.url() ).toEqual(
			expect.stringContaining( 'post-new.php' )
		);
		// Should display the blank title.
		const title = await page.locator( '[aria-label="Add title"]' );
		await expect( title ).toHaveCount( 1 );

		// Trim padding non-breaking space.
		expect(
			await title.evaluate( ( el ) => el.textContent.trim() )
		).toBeFalsy();
		// Should display the Preview button.
		const postPreviewButton = await page.locator(
			'.editor-post-preview.components-button'
		);
		await expect( postPreviewButton ).toHaveCount( 1 );

		// Should display the Post Formats UI.
		const postFormatsUi = await page.locator( '.editor-post-format' );
		await expect( postFormatsUi ).toHaveCount( 1 );
	} );

	test( 'should have no history', async ( { page } ) => {
		const undoButton = await page.locator(
			'.editor-history__undo[aria-disabled="false"]'
		);
		const redoButton = await page.locator(
			'.editor-history__redo[aria-disabled="false"]'
		);

		await expect( undoButton ).toHaveCount( 0 );
		await expect( redoButton ).toHaveCount( 0 );
	} );

	test( 'should focus the title if the title is empty', async ( {
		page,
	} ) => {
		const activeElementClasses = await page.evaluate( () => {
			return Object.values( document.activeElement.classList );
		} );
		const activeElementTagName = await page.evaluate( () => {
			return document.activeElement.tagName.toLowerCase();
		} );

		expect( activeElementClasses ).toContain( 'editor-post-title__input' );
		expect( activeElementTagName ).toEqual( 'h1' );
	} );

	test( 'should not focus the title if the title exists', async ( {
		page,
	} ) => {
		// Enter a title for this post.
		await page.type( '.editor-post-title__input', 'Here is the title' );
		// Save the post as a draft.
		await page.click( '.editor-post-save-draft' );
		await page.waitForSelector( '.editor-post-saved-state.is-saved' );
		// Reload the browser so a post is loaded with a title.
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );

		const activeElementClasses = await page.evaluate( () => {
			return Object.values( document.activeElement.classList );
		} );
		const activeElementTagName = await page.evaluate( () => {
			return document.activeElement.tagName.toLowerCase();
		} );

		expect( activeElementClasses ).not.toContain(
			'editor-post-title__input'
		);
		// The document `body` should be the `activeElement`, because nothing is
		// focused by default when a post already has a title.
		expect( activeElementTagName ).toEqual( 'body' );
	} );

	test( 'should be saveable with sufficient initial edits', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.createNewPost( { title: 'Here is the title' } );

		// Verify saveable by presence of the Save Draft button.
		await page.locator( 'button.editor-post-save-draft' );
	} );
} );
