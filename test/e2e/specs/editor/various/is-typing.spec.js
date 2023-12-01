/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'isTyping', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should hide the toolbar when typing', async ( { editor, page } ) => {
		// Enter to reach paragraph block.
		await page.keyboard.press( 'Enter' );
		// Insert paragraph
		await page.keyboard.type( 'Type' );

		const blockToolbar = page.locator(
			'role=toolbar[name="Block tools"i]'
		);

		// Toolbar should not be showing
		await expect( blockToolbar ).toBeHidden();

		// Moving the mouse shows the toolbar.
		await editor.showBlockToolbar();

		// Toolbar is visible.
		await expect( blockToolbar ).toBeVisible();

		// Typing again hides the toolbar
		await page.keyboard.type( ' and continue' );

		// Toolbar is hidden again
		await expect( blockToolbar ).toBeHidden();
	} );

	test( 'should not close the dropdown when typing in it', async ( {
		editor,
		page,
	} ) => {
		// Add a block with a dropdown in the toolbar that contains an input.
		await editor.insertBlock( { name: 'core/query' } );

		// Tab to Start Blank Button
		await page.keyboard.press( 'Tab' );
		// Select the Start Blank Button
		await page.keyboard.press( 'Enter' );
		// Select the First variation
		await page.keyboard.press( 'Enter' );
		// Moving the mouse shows the toolbar.
		await editor.showBlockToolbar();
		// Open the dropdown.
		await page.getByRole( 'button', { name: 'Display settings' } ).click();

		const itemsPerPageInput = page.getByLabel( 'Items per Page' );
		// Make sure we're where we think we are
		await expect( itemsPerPageInput ).toBeFocused();
		// Type inside the dropdown's input
		await page.keyboard.type( '00' );
		// The input should still be visible.
		await expect( itemsPerPageInput ).toBeVisible();
	} );
} );
