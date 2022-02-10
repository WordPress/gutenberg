/**
 * Internal dependencies
 */
const { test, expect } = require( '../../../config/test' );

test.describe( 'new editor state', () => {
	test.beforeAll( async ( { testUtils } ) => {
		await testUtils.activatePlugin(
			'gutenberg-test-plugin-post-formats-support'
		);
	} );

	test.afterAll( async ( { testUtils } ) => {
		await testUtils.deactivatePlugin(
			'gutenberg-test-plugin-post-formats-support'
		);
	} );

	test( 'should show the New Post page in Gutenberg', async ( {
		page,
		testUtils,
	} ) => {
		await testUtils.createNewPost();

		expect( page.url() ).toEqual(
			expect.stringContaining( 'post-new.php' )
		);

		// Should display the blank title.
		const title = page.locator( 'role=textbox[name="Add title"i]' );
		await expect( title ).toBeEditable();

		// Trim padding non-breaking space
		expect(
			await title.evaluate( ( el ) => el.textContent.trim() )
		).toBeFalsy();

		// Should display the Preview button.
		await expect(
			page.locator( 'role=button[name="Preview"i]' )
		).toBeVisible();

		// Should display the Post Formats UI.
		await expect(
			page.locator( 'role=combobox[name="Post Format"i]' )
		).toBeVisible();
	} );

	test( 'should have no history', async ( { page, testUtils } ) => {
		await testUtils.createNewPost();

		await expect(
			page.locator( 'role=button[name="Undo"i]' )
		).toBeDisabled();
		await expect(
			page.locator( 'role=button[name="Redo"i]' )
		).toBeDisabled();
	} );

	test( 'should focus the title if the title is empty', async ( {
		page,
		testUtils,
	} ) => {
		await testUtils.createNewPost();

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
		testUtils,
	} ) => {
		await testUtils.createNewPost();

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
		testUtils,
	} ) => {
		await testUtils.createNewPost( { title: 'Here is the title' } );

		// Verify saveable by presence of the Save Draft button.
		const saveDraftButton = page.locator(
			'role=button[name="Save draft"i]'
		);
		await expect( saveDraftButton ).toBeVisible();
		await expect( saveDraftButton ).toBeEnabled();
	} );
} );
