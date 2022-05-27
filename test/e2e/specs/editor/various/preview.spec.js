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
		pageUtils,
		previewUtils,
		requestUtils,
	} ) => {
		const editorPage = page;

		// Disabled until content present.
		const isPreviewDisabled = await editorPage
			.locator( 'role=button[name="Preview"]' )
			.isDisabled();
		expect( isPreviewDisabled ).toEqual( true );

		await editorPage.type(
			'role=textbox[name="Add title"]',
			'Hello World'
		);

		const previewPage = await editor.openPreviewPage( editorPage );
		const previewTitle = previewPage.locator( 'role=heading[level=1]' );

		expect( await previewTitle.textContent() ).toEqual( 'Hello World' );

		// When autosave completes for a new post, the URL of the editor should
		// update to include the ID. Use this to assert on preview URL.
		const [ , postId ] = await (
			await editorPage.waitForFunction( () => {
				return window.location.search.match( /[\?&]post=(\d+)/ );
			} )
		 ).jsonValue();

		const expectedPreviewURL = new URL( requestUtils.baseURL );
		expectedPreviewURL.search = `?p=${ postId }&preview=true`;
		expect( previewPage.url() ).toEqual( expectedPreviewURL.href );

		// Return to editor to change title.
		await editorPage.bringToFront();
		await editorPage.type( 'role=textbox[name="Add title"]', '!' );
		await previewUtils.waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		expect( await previewTitle.textContent() ).toEqual( 'Hello World!' );

		// Pressing preview without changes should bring same preview window to
		// front and reload, but should not show interstitial.
		await editorPage.bringToFront();
		await previewUtils.waitForPreviewNavigation( previewPage );

		expect( await previewTitle.textContent() ).toEqual( 'Hello World!' );

		// Preview for published post (no unsaved changes) directs to canonical URL for post.
		await editorPage.bringToFront();
		await editor.publishPost();

		// Close the panel.
		await page.locator( 'role=button[name="Close panel"]' ).click();

		// Return to editor to change title.
		await editorPage.bringToFront();
		await editorPage.waitForSelector( 'role=textbox[name="Add title"]' );
		await editorPage.click( 'role=textbox[name="Add title"]' );
		await pageUtils.pressKeyWithModifier( 'primary', 'A' );
		await editorPage.keyboard.press( 'ArrowRight' );
		await editorPage.keyboard.type( ' And more.' );
		await previewUtils.waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		expect( await previewTitle.textContent() ).toEqual(
			'Hello World! And more.'
		);

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
		expect( await previewTitle.textContent() ).toEqual(
			'Hello World! And more.'
		);

		await previewPage.close();
	} );

	test( 'should not revert title during a preview right after a save draft', async ( {
		editor,
		page,
		pageUtils,
		previewUtils,
	} ) => {
		const editorPage = page;

		// Type aaaaa in the title field.
		await editorPage.type( 'role=textbox[name="Add title"]', 'aaaaa' );
		await editorPage.keyboard.press( 'Tab' );

		// Save the post as a draft.
		await editorPage.click( 'role=button[name="Save draft"i]' );
		await editorPage.waitForSelector(
			'role=button[name="Dismiss this notice"] >> text=Draft saved'
		);

		// Open the preview page.
		const previewPage = await editor.openPreviewPage( editorPage );
		await previewPage.waitForSelector( 'role=heading[level=1]' );

		// Title in preview should match input.
		const previewTitle = previewPage.locator( 'role=heading[level=1]' );
		expect( await previewTitle.textContent() ).toEqual( 'aaaaa' );

		// Return to editor.
		await editorPage.bringToFront();

		// Append bbbbb to the title, and tab away from the title so blur event is triggered.
		await editorPage.focus( 'role=textbox[name="Add title"]' );
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );
		await editorPage.keyboard.press( 'ArrowRight' );
		await editorPage.keyboard.type( 'bbbbb' );
		await editorPage.keyboard.press( 'Tab' );

		// Save draft and open the preview page right after.
		await editorPage.click( 'role=button[name="Save draft"i]' );
		await editorPage.waitForSelector(
			'role=button[name="Dismiss this notice"] >> text=Draft saved'
		);
		await previewUtils.waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		expect( await previewTitle.textContent() ).toEqual( 'aaaaabbbbb' );

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
		await editorPage.type( '[aria-label="Add title"]', 'Lorem' );

		// Open the preview page.
		const previewPage = await editor.openPreviewPage( editorPage );
		await previewPage.waitForSelector( 'role=heading[level=1]' );

		// Title in preview should match input.
		const previewTitle = previewPage.locator( 'role=heading[level=1]' );
		expect( await previewTitle.textContent() ).toEqual( 'Lorem' );

		// Return to editor and publish post.
		await editorPage.bringToFront();
		await editor.publishPost();

		// Close the panel.
		await page.locator( 'role=button[name="Close panel"]' ).click();

		// Change the title and preview again.
		await editorPage.type( '[aria-label="Add title"]', ' Ipsum' );
		await previewUtils.waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		expect( await previewTitle.textContent() ).toEqual( 'Lorem Ipsum' );

		// Return to editor and switch to Draft.
		await editorPage.bringToFront();
		await page.locator( 'role=button[name="Switch to draft"]' ).click();

		// Change the title.
		await editorPage.type( '[aria-label="Add title"]', ' Draft' );

		// Open the preview page.
		await previewUtils.waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		expect( await previewTitle.textContent() ).toEqual(
			'Lorem Ipsum Draft'
		);

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
		await editorPage.type( 'role=textbox[name="Add title"i]', 'title 1' );
		await editorPage.type(
			'role=button[name="Add default block"i]',
			'content 1'
		);

		// Publish the post and then close the publish panel.
		await editor.publishPost();

		// Close the panel.
		await page.locator( 'role=button[name="Close panel"]' ).click();

		// Open the preview page.
		const previewPage = await editor.openPreviewPage();
		await previewPage.waitForSelector( 'role=heading[level=1]' );

		// Check the title and preview match.
		const previewTitle = previewPage.locator( 'role=heading[level=1]' );
		expect( await previewTitle.textContent() ).toEqual( 'title 1' );
		// No semantics we can grab here; it's just a <p> inside a <div> :')
		const previewContent = previewPage.locator( '.entry-content p' );
		expect( await previewContent.textContent() ).toEqual( 'content 1' );

		// Return to editor and modify the title and content.
		await editorPage.bringToFront();
		await editorPage.click( 'role=textbox[name="Add title"i]' );
		await editorPage.keyboard.press( 'End' );
		await editorPage.keyboard.press( 'Backspace' );
		await editorPage.keyboard.type( '2' );
		await editorPage.click( 'role=document >> text="content 1"' );
		await editorPage.keyboard.press( 'End' );
		await editorPage.keyboard.press( 'Backspace' );
		await editorPage.keyboard.type( '2' );

		// Open the preview page.
		await previewUtils.waitForPreviewNavigation( previewPage );

		// Title in preview should match input.
		expect( await previewTitle.textContent() ).toEqual( 'title 2' );

		expect( await previewContent.textContent() ).toEqual( 'content 2' );

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
		await admin.createNewPost( { postType: 'not_public' } );

		// Type in the title filed.
		await page.type( 'role=textbox[name="Add title"i]', 'aaaaa' );

		// Open the preview menu.
		await page.click( 'role=button[name="Preview"i]' );

		const previewMenu = page.locator( 'role=menu' );
		await expect( previewMenu ).not.toContainText( 'Preview in new tab' );
	} );
} );

class PreviewUtils {
	constructor( { page } ) {
		this.page = page;
	}

	async waitForPreviewNavigation( previewPage ) {
		const previewToggle = this.page.locator(
			'role=button[name="Preview"i][expanded=false]'
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

		// Navigate to panels section.
		await this.page.click(
			'role=dialog[name="Preferences"i] >> role=tab[name="Panels"i]'
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

		await this.page.click( 'role=button[name="Close dialog"i]' );
	}
}
