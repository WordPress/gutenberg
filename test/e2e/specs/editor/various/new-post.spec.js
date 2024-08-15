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

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-post-formats-support'
		);
	} );

	test( 'should show the New Post page in Gutenberg', async ( {
		admin,
		page,
		editor,
	} ) => {
		await admin.createNewPost();

		await expect( page ).toHaveURL( /post-new.php/ );

		// Should display the blank title.
		const title = editor.canvas.locator(
			'role=textbox[name="Add title"i]'
		);
		await expect( title ).toBeEditable();
		await expect( title ).toHaveText( '' );

		// Should display the View button.
		await expect(
			page.locator( 'role=button[name="View"i]' )
		).toBeVisible();

		// Should display the Post Formats UI.
		await editor.openDocumentSettingsSidebar();
		await expect(
			page.locator( 'role=button[name="Change Format: Standard"i]' )
		).toBeVisible();
	} );

	test( 'should have no history', async ( { admin, page } ) => {
		await admin.createNewPost();

		await expect(
			page.locator( 'role=button[name="Undo"i]' )
		).toBeDisabled();
		await expect(
			page.locator( 'role=button[name="Redo"i]' )
		).toBeDisabled();
	} );

	test( 'should focus the title if the title is empty', async ( {
		admin,
		editor,
	} ) => {
		await admin.createNewPost();

		await expect(
			editor.canvas.locator( 'role=textbox[name="Add title"i]' )
		).toBeFocused();
	} );

	test( 'should not focus the title if the title exists', async ( {
		admin,
		page,
		editor,
	} ) => {
		await admin.createNewPost();

		// Enter a title for this post.
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.type( 'Here is the title' );
		// Save the post as a draft.
		await editor.saveDraft();

		// Reload the browser so a post is loaded with a title.
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );

		// The document `body` should be the `activeElement`, because nothing is
		// focused by default when a post already has a title.
		await expect( page.locator( 'body' ) ).toBeFocused();
	} );

	test( 'should be saveable with sufficient initial edits', async ( {
		admin,
		page,
	} ) => {
		await admin.createNewPost( { title: 'Here is the title' } );

		// Verify saveable by presence of the Save Draft button.
		const saveDraftButton = page.locator(
			'role=button[name="Save draft"i]'
		);
		await expect( saveDraftButton ).toBeVisible();
		await expect( saveDraftButton ).toBeEnabled();
	} );
} );
