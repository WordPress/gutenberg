/**
 * External dependencies
 */
import { last } from 'lodash';
import { parse } from 'url';

/**
 * WordPress dependencies
 */
import {
	clickOnCloseModalButton,
	createNewPost,
	createURL,
	publishPost,
	saveDraft,
	clickOnMoreMenuItem,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

/** @typedef {import('puppeteer').Page} Page */

async function openPreviewPage( editorPage ) {
	let openTabs = await browser.pages();
	const expectedTabsCount = openTabs.length + 1;
	await editorPage.click( '.editor-post-preview' );

	// Wait for the new tab to open.
	while ( openTabs.length < expectedTabsCount ) {
		await editorPage.waitFor( 1 );
		openTabs = await browser.pages();
	}

	const previewPage = last( openTabs );
	// Wait for the preview to load. We can't do interstitial detection here,
	// because it might load too quickly for us to pick up, so we wait for
	// the preview to load by waiting for the title to appear.
	await previewPage.waitForSelector( '.entry-title' );
	return previewPage;
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
	await page.click( '.editor-post-preview' );
	return previewPage.waitForNavigation();
}

/**
 * Enables or disables the custom fields option.
 *
 * Note that this is implemented separately from the `toggleScreenOptions`
 * utility, since the custom fields option triggers a page reload and requires
 * extra async logic to wait for navigation to complete.
 *
 * @param {boolean} shouldBeChecked If true, turns the option on. If false, off.
 */
async function toggleCustomFieldsOption( shouldBeChecked ) {
	const checkboxXPath =
		'//*[contains(@class, "edit-post-options-modal")]//label[contains(text(), "Custom fields")]';
	await clickOnMoreMenuItem( 'Options' );
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

	await clickOnCloseModalButton( '.edit-post-options-modal' );
}

describe( 'Preview', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should open a preview window for a new post', async () => {
		const editorPage = page;

		// Disabled until content present.
		const isPreviewDisabled = await editorPage.$$eval(
			'.editor-post-preview:not( :disabled ):not( [aria-disabled="true"] )',
			( enabledButtons ) => ! enabledButtons.length
		);
		expect( isPreviewDisabled ).toBe( true );

		await editorPage.type( '.editor-post-title__input', 'Hello World' );

		const previewPage = await openPreviewPage( editorPage );

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
		await publishPost();

		// Return to editor to change title.
		await editorPage.bringToFront();
		await editorPage.type( '.editor-post-title__input', ' And more.' );
		await waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);
		expect( previewTitle ).toBe( 'Hello World! And more.' );

		// Published preview URL should include ID and nonce parameters.
		const { query } = parse( previewPage.url(), true );
		expect( query ).toHaveProperty( 'preview_id' );
		expect( query ).toHaveProperty( 'preview_nonce' );

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

		// Type aaaaa in the title filed.
		await editorPage.type( '.editor-post-title__input', 'aaaaa' );
		await editorPage.keyboard.press( 'Tab' );

		// Save the post as a draft.
		await editorPage.waitForSelector( '.editor-post-save-draft' );
		await saveDraft();

		// Open the preview page.
		const previewPage = await openPreviewPage( editorPage );

		// Title in preview should match input.
		let previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);
		expect( previewTitle ).toBe( 'aaaaa' );

		// Return to editor.
		await editorPage.bringToFront();

		// Append bbbbb to the title, and tab away from the title so blur event is triggered.
		await editorPage.type( '.editor-post-title__input', 'bbbbb' );
		await editorPage.keyboard.press( 'Tab' );

		// Save draft and open the preview page right after.
		await editorPage.waitForSelector( '.editor-post-save-draft' );
		await saveDraft();
		await waitForPreviewNavigation( previewPage );

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval(
			'.entry-title',
			( node ) => node.textContent
		);
		expect( previewTitle ).toBe( 'aaaaabbbbb' );

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
		await pressKeyWithModifier( 'primary', 'a' );
		await editorPage.keyboard.press( 'Delete' );
		await editorPage.keyboard.type( 'title 2' );
		await editorPage.keyboard.press( 'Tab' );
		await pressKeyWithModifier( 'primary', 'a' );
		await editorPage.keyboard.press( 'Delete' );
		await editorPage.keyboard.type( 'content 2' );

		// Open the preview page.
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
