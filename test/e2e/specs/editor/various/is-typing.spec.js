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

		const blockToolbarPopover = page.locator(
			'[data-wp-component="Popover"]',
			{
				has: page.locator( 'role=toolbar[name="Block tools"i]' ),
			}
		);

		// Toolbar Popover should not be showing
		await expect( blockToolbarPopover ).toBeHidden();

		// Moving the mouse shows the toolbar.
		await editor.showBlockToolbar();

		// Toolbar Popover is visible.
		await expect( blockToolbarPopover ).toBeVisible();

		// Typing again hides the toolbar
		await page.keyboard.type( ' and continue' );

		// Toolbar Popover is hidden again
		await expect( blockToolbarPopover ).toBeHidden();
	} );

	test( 'should not close the dropdown when typing in it', async ( {
		editor,
		page,
	} ) => {
		// Add a block with a dropdown in the toolbar that contains an input.
		await editor.insertBlock( { name: 'core/query' } );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Query Loop' } )
			.getByRole( 'button', { name: 'Start blank' } )
			.click();

		await editor.canvas
			.getByRole( 'button', { name: 'Title & Date' } )
			.click();

		// Moving the mouse shows the toolbar.
		await editor.showBlockToolbar();
		// Open the dropdown.
		const displaySettings = page.getByRole( 'button', {
			name: 'Display settings',
		} );
		await displaySettings.click();
		const itemsPerPageInput = page.getByLabel( 'Items per Page' );
		// Make sure we're where we think we are
		await expect( itemsPerPageInput ).toBeFocused();
		// Type inside the dropdown's input
		await page.keyboard.type( '00' );
		// The input should still be visible.
		await expect( itemsPerPageInput ).toBeVisible();
	} );
} );
