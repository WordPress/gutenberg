/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	insertBlock,
	saveDraft,
} from '@wordpress/e2e-test-utils';

async function openPreviewPage( editorPage ) {
	let openTabs = await browser.pages();
	const expectedTabsCount = openTabs.length + 1;
	await editorPage.click( '.block-editor-post-preview__button-toggle' );
	await editorPage.waitFor( '.edit-post-header-preview__button-external' );
	await editorPage.click( '.edit-post-header-preview__button-external' );

	// Wait for the new tab to open.
	while ( openTabs.length < expectedTabsCount ) {
		await editorPage.waitFor( 1 );
		openTabs = await browser.pages();
	}

	const previewPage = last( openTabs );
	// Wait for the preview to load. We can't do interstitial detection here,
	// because it might load too quickly for us to pick up, so we wait for
	// the preview to load by waiting for the content to appear.
	await previewPage.waitForSelector( '.entry-content' );
	return previewPage;
}

describe( 'Block context', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-block-context' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-block-context' );
	} );

	test( 'Block context propagates to inner blocks', async () => {
		await insertBlock( 'Test Context Provider' );

		// Inserting the context provider block should select the first inner
		// block of the template. Verify the contents of the consumer.
		let innerBlockText = await page.evaluate(
			() => document.activeElement.textContent
		);
		expect( innerBlockText ).toBe( 'The record ID is: 0' );

		// Change the attribute value associated with the context.
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '123' );

		// Verify propagated context changes.
		await page.keyboard.press( 'ArrowDown' );
		innerBlockText = await page.evaluate(
			() => document.activeElement.textContent
		);
		expect( innerBlockText ).toBe( 'The record ID is: 123' );
	} );

	test( 'Block context is reflected in the preview', async () => {
		await insertBlock( 'Test Context Provider' );
		const editorPage = page;
		const previewPage = await openPreviewPage( editorPage );

		// Check default context values are populated.
		let content = await previewPage.$eval(
			'.entry-content',
			( contentWrapper ) => contentWrapper.textContent.trim()
		);
		expect( content ).toMatch( /^0,\d+,post$/ );

		// Return to editor to change context value to non-default.
		await editorPage.bringToFront();
		await editorPage.focus(
			'[data-type="gutenberg/test-context-provider"] input'
		);
		await editorPage.keyboard.press( 'ArrowRight' );
		await editorPage.keyboard.type( '123' );
		await editorPage.waitForSelector( '.editor-post-save-draft' ); // Not entirely clear why it's asynchronous, but likely React scheduling prioritizing keyboard event and deferring the UI update.
		await saveDraft();

		// Check non-default context values are populated.
		await previewPage.bringToFront();
		await previewPage.reload();
		content = await previewPage.$eval(
			'.entry-content',
			( contentWrapper ) => contentWrapper.textContent.trim()
		);
		expect( content ).toMatch( /^123,\d+,post$/ );

		// Clean up
		await editorPage.bringToFront();
		await previewPage.close();
	} );
} );
