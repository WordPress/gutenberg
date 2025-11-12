/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	previewUtils: async ( { page }, use ) => {
		await use( new PreviewUtils( { page } ) );
	},
} );

test.describe( 'Preview', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should open a preview window for a new post', async ( {
		editor,
		page,
		previewUtils,
		requestUtils,
	} ) => {
		const editorPage = page;

		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.type( 'Hello World' );

		const previewPage = await editor.openPreviewPage( editorPage );
		const previewTitle = previewPage.locator( 'role=heading[level=1]' );

		await expect( previewTitle ).toHaveText( 'Hello World' );

		// When autosave completes for a new post, the URL of the editor should
		// update to include the ID. Use this to assert on preview URL.
		await expect( editorPage ).toHaveURL( /[\?&]post=(\d+)/ );
		const [ , postId ] = editorPage.url().match( /[\?&]post=(\d+)/ );

		const expectedPreviewURL = new URL( requestUtils.baseURL );
		expectedPreviewURL.search = `?p=${ postId }&preview=true`;
		await expect( previewPage ).toHaveURL( expectedPreviewURL.href );

		// Return to editor to change title.
		await editorPage.bringToFront();
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.type( '!' );
		await previewUtils.waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		await expect( previewTitle ).toHaveText( 'Hello World!' );

		// Pressing preview without changes should bring same preview window to
		// front and reload, but should not show interstitial.
		await editorPage.bringToFront();
		await previewUtils.waitForPreviewNavigation( previewPage );

		await expect( previewTitle ).toHaveText( 'Hello World!' );

		// Preview for published post (no unsaved changes) directs to canonical URL for post.
		await editorPage.bringToFront();
		await editor.publishPost();

		// Close the panel.
		await page.click( 'role=button[name="Close panel"i]' );

		// Return to editor to change title.
		await editorPage.bringToFront();
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.fill( 'Hello World! And more.' );
		await previewUtils.waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		await expect( previewTitle ).toHaveText( 'Hello World! And more.' );

		// Published preview URL should include ID and nonce parameters.
		const { searchParams } = new URL( previewPage.url() );
		expect( searchParams.has( 'preview_id' ) ).toEqual( true );
		expect( searchParams.has( 'preview_nonce' ) ).toEqual( true );

		// Return to editor. Previewing already-autosaved preview tab should
		// reuse the opened tab, skipping interstitial. This resolves an edge
		// cases where the post is dirty but not autosaveable (because the
		// autosave is already up-to-date).
		//
		// See: https://github.com/WordPress/gutenberg/issues/7561
		await editorPage.bringToFront();
		await previewUtils.waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		await expect( previewTitle ).toHaveText( 'Hello World! And more.' );

		await previewPage.close();
	} );

	test( 'should not revert title during a preview right after a save draft', async ( {
		editor,
		page,
		previewUtils,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		const editorPage = page;

		// Type aaaaa in the title field.
		await editor.canvas
			.locator( 'role=textbox[name="Add title"]' )
			.type( 'aaaaa' );
		await editorPage.keyboard.press( 'Tab' );

		// Save the post as a draft.
		await editorPage.click( 'role=button[name="Save draft"i]' );
		await editorPage.waitForSelector(
			'role=button[name="Dismiss this notice"] >> text=Draft saved'
		);

		// Open the preview page.
		const previewPage = await editor.openPreviewPage( editorPage );

		// Title in preview should match input.
		const previewTitle = previewPage.locator( 'role=heading[level=1]' );
		await expect( previewTitle ).toHaveText( 'aaaaa' );

		// Return to editor.
		await editorPage.bringToFront();

		// Append bbbbb to the title, and tab away from the title so blur event is triggered.
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.fill( 'aaaaabbbbb' );
		await editorPage.keyboard.press( 'Tab' );

		// Save draft and open the preview page right after.
		await editorPage.click( 'role=button[name="Save draft"i]' );
		await editorPage.waitForSelector(
			'role=button[name="Dismiss this notice"] >> text=Draft saved'
		);
		await previewUtils.waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		await expect( previewTitle ).toHaveText( 'aaaaabbbbb' );

		await previewPage.close();
	} );

	// Verify correct preview. See: https://github.com/WordPress/gutenberg/issues/33616
	test( 'should display the correct preview when switching between published and draft statuses', async ( {
		editor,
		page,
		previewUtils,
	} ) => {
		const editorPage = page;

		// Type Lorem in the title field.
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.type( 'Lorem' );
		await editor.openDocumentSettingsSidebar();

		// Open the preview page.
		const previewPage = await editor.openPreviewPage( editorPage );

		// Title in preview should match input.
		const previewTitle = previewPage.locator( 'role=heading[level=1]' );
		await expect( previewTitle ).toHaveText( 'Lorem' );

		// Return to editor and publish post.
		await editorPage.bringToFront();
		await editor.publishPost();

		// Close the panel.
		await page.click( 'role=button[name="Close panel"i]' );

		// Change the title and preview again.
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.type( ' Ipsum' );
		await previewUtils.waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		await expect( previewTitle ).toHaveText( 'Lorem Ipsum' );

		// Return to editor and switch to Draft.
		await editorPage.bringToFront();
		await page.getByRole( 'button', { name: 'Change status:' } ).click();
		await page.getByRole( 'radio', { name: 'Draft' } ).click();
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', {
				name: 'Save',
				exact: true,
			} )
			.click();

		// Wait for the status change.
		// @see https://github.com/WordPress/gutenberg/pull/43933
		await expect(
			page.locator( 'role=button[name="Publish"i]' )
		).toBeVisible();

		// Change the title.
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.type( ' Draft' );

		// Open the preview page.
		await previewUtils.waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		await expect( previewTitle ).toHaveText( 'Lorem Ipsum Draft' );

		await previewPage.close();
	} );
} );

test.describe( 'Preview with Custom Fields enabled', () => {
	test.beforeEach( async ( { admin, previewUtils } ) => {
		await admin.createNewPost();
		await previewUtils.toggleCustomFieldsOption( true );
	} );

	test.afterEach( async ( { previewUtils } ) => {
		await previewUtils.toggleCustomFieldsOption( false );
	} );

	// Catch regressions of https://github.com/WordPress/gutenberg/issues/12617
	test( 'displays edits to the post title and content in the preview', async ( {
		editor,
		page,
		previewUtils,
	} ) => {
		const editorPage = page;

		// Add an initial title and content.
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.type( 'title 1' );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'content 1' },
		} );

		// Publish the post and then close the publish panel.
		await editor.publishPost();

		// Close the panel.
		await page.click( 'role=button[name="Close panel"i]' );

		// Open the preview page.
		const previewPage = await editor.openPreviewPage();

		// Check the title and preview match.
		const previewTitle = previewPage.locator( 'role=heading[level=1]' );
		await expect( previewTitle ).toHaveText( 'title 1' );
		// No semantics we can grab here; it's just a <p> inside a <div> :')
		const previewContent = previewPage.locator( '.entry-content p' );
		await expect( previewContent ).toHaveText( 'content 1' );

		// Return to editor and modify the title and content.
		await editorPage.bringToFront();
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.fill( 'title 2' );
		await editor.canvas
			.locator( 'role=document >> text="content 1"' )
			.fill( 'content 2' );

		// Open the preview page.
		await previewUtils.waitForPreviewNavigation( previewPage );

		// Title in preview should match input.
		await expect( previewTitle ).toHaveText( 'title 2' );
		await expect( previewContent ).toHaveText( 'content 2' );

		// Make sure the editor is active for the afterEach function.
		await editorPage.bringToFront();
	} );
} );

test.describe( 'Preview with private custom post type', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-custom-post-types'
		);
	} );

	test( 'should not show the Preview Externally link', async ( {
		admin,
		page,
	} ) => {
		await admin.createNewPost( {
			postType: 'not_public',
			title: 'aaaaa',
		} );

		// Open the view menu.
		await page.click( 'role=button[name="View"i]' );

		await expect(
			page.locator( 'role=menuitem[name="Preview in new tab"i]' )
		).toBeHidden();
	} );
} );

class PreviewUtils {
	constructor( { page } ) {
		this.page = page;
	}

	async waitForPreviewNavigation( previewPage ) {
		const previewToggle = this.page.locator(
			'role=button[name="View"i][expanded=false]'
		);
		const isDropdownClosed = await previewToggle.isVisible();
		if ( isDropdownClosed ) {
			await previewToggle.click();
		}

		await this.page.click( 'role=menuitem[name="Preview in new tab"i]' );
		return previewPage.waitForNavigation();
	}

	async toggleCustomFieldsOption( shouldBeChecked ) {
		// Open preferences dialog.

		await this.page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Options"i]'
		);
		await this.page.click( 'role=menuitem[name="Preferences"i]' );

		// Navigate to general section.
		await this.page.click(
			'role=dialog[name="Preferences"i] >> role=tab[name="General"i]'
		);

		// Find custom fields checkbox.
		const customFieldsCheckbox = this.page.locator(
			'role=checkbox[name="Custom fields"i]'
		);

		if ( shouldBeChecked ) {
			await customFieldsCheckbox.check();
		} else {
			await customFieldsCheckbox.uncheck();
		}

		const saveButton = this.page.locator(
			'role=button[name=/(Dis|En)able & Reload/i]'
		);
		const isSaveVisible = await saveButton.isVisible();

		if ( isSaveVisible ) {
			saveButton.click();
			await this.page.waitForNavigation();
			return;
		}

		await this.page.click(
			'role=dialog[name="Preferences"i] >> role=button[name="Close"i]'
		);
	}
}
