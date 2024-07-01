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
} );
