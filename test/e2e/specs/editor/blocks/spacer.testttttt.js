/**
 * WordPress dependencies
 */
// import {
// 	clickBlockAppender,
// 	getEditedPostContent,
// 	createNewPost,
// 	dragAndResize,
// } from '@wordpress/e2e-test-utils';
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Spacer', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by typing "/spacer"', async ( { editor, page } ) => {
		// Create a spacer with the slash block shortcut.
		await editor.clickBlockAppender();
		await page.keyboard.type( '/spacer' );
		await page.waitForXPath(
			`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'Spacer')]`
		);
		await page.keyboard.press( 'Enter' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can be resized using the drag handle and remains selected after being dragged', async ( {
		page,
		editor,
	} ) => {
		// Create a spacer with the slash block shortcut.
		await editor.clickBlockAppender();
		await page.keyboard.type( '/spacer' );
		await page.waitForXPath(
			`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'Spacer')]`
		);
		await page.keyboard.press( 'Enter' );

		const resizableHandle = await page.locator(
			'.block-library-spacer__resize-container .components-resizable-box__handle'
		);
		await editor.dragAndResize( resizableHandle, { x: 0, y: 50 } );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		const selectedSpacer = await page.locator(
			'[data-type="core/spacer"].is-selected'
		);
		expect( selectedSpacer ).not.toBe( null );
	} );
} );
