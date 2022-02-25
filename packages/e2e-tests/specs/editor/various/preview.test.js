/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	clickOnCloseModalButton,
	clickOnMoreMenuItem,
	createNewPost,
	createURL,
	deactivatePlugin,
	publishPost,
	saveDraft,
	openPreviewPage,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

/** @typedef {import('puppeteer-core').Page} Page */

/**
 * Given the Page instance for the editor, opens preview drodpdown, and
 * awaits the presence of the external preview selector.
 *
 * @param {Page} editorPage current editor page.
 *
 * @return {Promise} Promise resolving once selector is visible on page.
 */
async function waitForPreviewDropdownOpen( editorPage ) {
	await editorPage.click( '.block-editor-post-preview__button-toggle' );
	return editorPage.waitForSelector(
		'.edit-post-header-preview__button-external'
	);
}

/**
 * Given a Puppeteer Page instance for a preview window, clicks Preview, and
 * awaits the window navigation.
 *
 * @param {Page} previewPage Page on which to await navigation.
 *
 * @return {Promise} Promise resolving once navigation completes.
 */
async function waitForPreviewNavigation( previewPage ) {
	await page.click( '.edit-post-header-preview__button-external' );
	return previewPage.waitForNavigation();
}

/**
 * Enables or disables the custom fields option.
 *
 * Note that this is implemented separately from the `togglePreferencesOption`
 * utility, since the custom fields option triggers a page reload and requires
 * extra async logic to wait for navigation to complete.
 *
 * @param {boolean} shouldBeChecked If true, turns the option on. If false, off.
 */
async function toggleCustomFieldsOption( shouldBeChecked ) {
	const baseXPath = '//*[contains(@class, "edit-post-preferences-modal")]';
	const paneslXPath = `${ baseXPath }//button[contains(text(), "Panels")]`;
	const checkboxXPath = `${ baseXPath }//label[contains(text(), "Custom fields")]`;
	await clickOnMoreMenuItem( 'Preferences' );
	await page.waitForXPath( paneslXPath );
	const [ tabHandle ] = await page.$x( paneslXPath );
	await tabHandle.click();

	await page.waitForXPath( checkboxXPath );
	const [ checkboxHandle ] = await page.$x( checkboxXPath );

	const isChecked = await page.evaluate(
		( element ) => element.control.checked,
		checkboxHandle
	);

	if ( isChecked !== shouldBeChecked ) {
		await checkboxHandle.click();
		const [ saveButton ] = await page.$x(
			shouldBeChecked
				? '//button[text()="Enable & Reload"]'
				: '//button[text()="Disable & Reload"]'
		);
		const navigationCompleted = page.waitForNavigation();
		saveButton.click();
		await navigationCompleted;
		return;
	}

	await clickOnCloseModalButton( '.edit-post-preferences-modal' );
}

describe( 'Preview', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should open a preview window for a new post', async () => {
		const editorPage = page;

		// Disabled until content present.
		const isPreviewDisabled = await editorPage.$$eval(
			'.block-editor-post-preview__button-toggle:not( :disabled ):not( [aria-disabled="true"] )',
			( enabledButtons ) => ! enabledButtons.length
		);
		expect( isPreviewDisabled ).toBe( true );

		await editorPage.type( '.editor-post-title__input', 'Hello World' );

		const previewPage = await openPreviewPage( editorPage );
		await previewPage.waitForSelector( '.entry-title' );

		// When autosave completes for a new post, the URL of the editor should
		// update to include the ID. Use this to assert on preview URL.
		const [ , postId ] = await (
			await editorPage.waitForFunction( () => {
				return window.location.search.match( /[\?&]post=(\d+)/ );
			} )
		 ).jsonValue();

		const expectedPreviewURL = createURL(
			'',
			`?p=${ postId }&preview=true`
		);
		expect( previewPage.url() ).toBe( expectedPreviewURL );

		// Title in preview should match input.
		let previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);
		expect( previewTitle ).toBe( 'Hello World' );

		// Return to editor to change title.
		await editorPage.bringToFront();
		await editorPage.type( '.editor-post-title__input', '!' );
		await waitForPreviewDropdownOpen( editorPage );
		await waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);
		expect( previewTitle ).toBe( 'Hello World!' );

		// Pressing preview without changes should bring same preview window to
		// front and reload, but should not show interstitial.
		await editorPage.bringToFront();
		await waitForPreviewNavigation( previewPage );
		previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);
		expect( previewTitle ).toBe( 'Hello World!' );

		// Preview for published post (no unsaved changes) directs to canonical URL for post.
		await editorPage.bringToFront();
		/**
		 * Temp workaround until we find a reliable solution for `publishPost` util.
		 *
		 * @see https://github.com/WordPress/gutenberg/pull/35565
		 */
		await editorPage.click( '.components-snackbar' );
		await publishPost();

		// Return to editor to change title.
		await editorPage.bringToFront();
		await editorPage.waitForSelector( '.editor-post-title__input' );
		await editorPage.click( '.editor-post-title__input' );
		await pressKeyWithModifier( 'primary', 'A' );
		await editorPage.keyboard.press( 'ArrowRight' );
		await editorPage.keyboard.type( ' And more.' );
		await waitForPreviewDropdownOpen( editorPage );
		await waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);
		expect( previewTitle ).toBe( 'Hello World! And more.' );

		// Published preview URL should include ID and nonce parameters.
		const { searchParams } = new URL( previewPage.url() );
		expect( searchParams.has( 'preview_id' ) ).toBe( true );
		expect( searchParams.has( 'preview_nonce' ) ).toBe( true );

		// Return to editor. Previewing already-autosaved preview tab should
		// reuse the opened tab, skipping interstitial. This resolves an edge
		// cases where the post is dirty but not autosaveable (because the
		// autosave is already up-to-date).
		//
		// See: https://github.com/WordPress/gutenberg/issues/7561
		await editorPage.bringToFront();
		await waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);
		expect( previewTitle ).toBe( 'Hello World! And more.' );

		await previewPage.close();
	} );

	it( 'should not revert title during a preview right after a save draft', async () => {
		const editorPage = page;

		// Type aaaaa in the title field.
		await editorPage.type( '.editor-post-title__input', 'aaaaa' );
		await editorPage.keyboard.press( 'Tab' );

		// Save the post as a draft.
		await editorPage.waitForSelector( '.editor-post-save-draft' );
		await saveDraft();

		// Open the preview page.
		const previewPage = await openPreviewPage( editorPage );
		await previewPage.waitForSelector( '.entry-title' );

		// Title in preview should match input.
		let previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);
		expect( previewTitle ).toBe( 'aaaaa' );

		// Return to editor.
		await editorPage.bringToFront();

		// Append bbbbb to the title, and tab away from the title so blur event is triggered.
		await editorPage.focus( '.editor-post-title__input' );
		await pressKeyWithModifier( 'primary', 'a' );
		await editorPage.keyboard.press( 'ArrowRight' );
		await editorPage.keyboard.type( 'bbbbb' );
		await editorPage.keyboard.press( 'Tab' );

		// Save draft and open the preview page right after.
		await editorPage.waitForSelector( '.editor-post-save-draft' );
		await saveDraft();
		await waitForPreviewDropdownOpen( editorPage );
		await waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);
		expect( previewTitle ).toBe( 'aaaaabbbbb' );

		await previewPage.close();
	} );

	// Verify correct preview. See: https://github.com/WordPress/gutenberg/issues/33616
	it( 'should display the correct preview when switching between published and draft statuses', async () => {
		const editorPage = page;

		// Type Lorem in the title field.
		await editorPage.type( '[aria-label="Add title"]', 'Lorem' );

		// Open the preview page.
		const previewPage = await openPreviewPage( editorPage );
		await previewPage.waitForSelector( '.entry-title' );

		// Title in preview should match input.
		let previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);
		expect( previewTitle ).toBe( 'Lorem' );

		// Return to editor and publish post.
		await editorPage.bringToFront();
		await publishPost();

		// Close the panel.
		await page.waitForSelector(
			'.editor-post-publish-panel button[aria-label="Close panel"]'
		);
		await page.click(
			'.editor-post-publish-panel button[aria-label="Close panel"]'
		);

		// Change the title and preview again.
		await editorPage.type( '[aria-label="Add title"]', ' Ipsum' );
		await editorPage.keyboard.press( 'Tab' );
		await waitForPreviewDropdownOpen( editorPage );
		await waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);

		expect( previewTitle ).toBe( 'Lorem Ipsum' );

		// Return to editor and switch to Draft.
		await editorPage.bringToFront();
		await editorPage.waitForSelector( '.editor-post-switch-to-draft' );
		await editorPage.click( '.editor-post-switch-to-draft' );
		await page.keyboard.press( 'Enter' );

		// Change the title.
		await editorPage.type( '[aria-label="Add title"]', 'Draft ' );
		await editorPage.keyboard.press( 'Tab' );

		// Open the preview page.
		await waitForPreviewDropdownOpen( editorPage );
		await waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);

		expect( previewTitle ).toBe( 'Draft Lorem Ipsum' );

		await previewPage.close();
	} );
} );

describe( 'Preview with Custom Fields enabled', () => {
	beforeEach( async () => {
		await createNewPost();
		await toggleCustomFieldsOption( true );
	} );

	afterEach( async () => {
		await toggleCustomFieldsOption( false );
	} );

	// Catch regressions of https://github.com/WordPress/gutenberg/issues/12617
	it( 'displays edits to the post title and content in the preview', async () => {
		const editorPage = page;

		// Make sure input is mounted in editor before adding content.
		await editorPage.waitForSelector( '.editor-post-title__input' );
		// Add an initial title and content.
		await editorPage.type( '.editor-post-title__input', 'title 1' );
		await editorPage.keyboard.press( 'Tab' );
		await editorPage.keyboard.type( 'content 1' );

		// Publish the post and then close the publish panel.
		await publishPost();
		await page.waitForSelector( '.editor-post-publish-panel' );
		await page.click( '.editor-post-publish-panel__header button' );

		// Open the preview page.
		const previewPage = await openPreviewPage( editorPage );
		await previewPage.waitForSelector( '.entry-title' );

		// Check the title and preview match.
		let previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);
		expect( previewTitle ).toBe( 'title 1' );
		let previewContent = await previewPage.$eval(
			'.entry-content p',
			( node ) => node.textContent
		);
		expect( previewContent ).toBe( 'content 1' );

		// Return to editor and modify the title and content.
		await editorPage.bringToFront();
		await editorPage.click( '.editor-post-title__input' );
		await editorPage.keyboard.press( 'End' );
		await editorPage.keyboard.press( 'Backspace' );
		await editorPage.keyboard.type( '2' );
		await editorPage.keyboard.press( 'Tab' );
		await editorPage.keyboard.press( 'End' );
		await editorPage.keyboard.press( 'Backspace' );
		await editorPage.keyboard.type( '2' );

		// Open the preview page.
		await waitForPreviewDropdownOpen( editorPage );
		await waitForPreviewNavigation( previewPage );

		// Title in preview should match input.
		previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);
		expect( previewTitle ).toBe( 'title 2' );
		previewContent = await previewPage.$eval(
			'.entry-content p',
			( node ) => node.textContent
		);
		expect( previewContent ).toBe( 'content 2' );

		// Make sure the editor is active for the afterEach function.
		await editorPage.bringToFront();
	} );
} );

describe( 'Preview with private custom post type', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	it( 'should not show the Preview Externally link', async () => {
		await createNewPost( { postType: 'not_public' } );

		// Type in the title filed.
		await page.type( '.editor-post-title__input', 'aaaaa' );
		await page.keyboard.press( 'Tab' );

		// Open the preview menu.
		await page.click( '.block-editor-post-preview__button-toggle' );

		const previewDropdownContents = await page.$(
			'.block-editor-post-preview__dropdown-content'
		);

		// Expect the Preview Externally link not to be present.
		const previewExternallyLink = await previewDropdownContents.$x(
			'//a[contains(text(), "Preview externally")]'
		);
		expect( previewExternallyLink.length ).toBe( 0 );
	} );
} );
