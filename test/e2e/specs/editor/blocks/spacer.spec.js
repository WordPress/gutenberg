/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Spacer', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by typing "/spacer"', async ( { editor, page } ) => {
		// Create a spacer with the slash block shortcut.
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '/spacer' );
		await page.keyboard.press( 'Enter' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can be resized using the drag handle and remains selected after being dragged', async ( {
		page,
		editor,
	} ) => {
		// Create a spacer with the slash block shortcut.
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '/spacer' );
		await page.keyboard.press( 'Enter' );

		const resizableHandle = page.locator(
			'[aria-label="Block: Spacer"] .block-library-spacer__resize-container .components-resizable-box__handle'
		);
		await editor.dragAndResize( resizableHandle, { x: 0, y: 50 } );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		const selectedSpacer = page.locator(
			'[data-type="core/spacer"].is-selected'
		);
		expect( selectedSpacer ).not.toBe( null );
	} );
} );
