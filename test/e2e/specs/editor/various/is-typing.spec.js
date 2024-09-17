/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'isTyping', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-observe-typing' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-observe-typing' );
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
		await editor.insertBlock( { name: 'e2e-tests/observe-typing' } );

		// Moving the mouse shows the toolbar.
		await editor.showBlockToolbar();
		// Open the dropdown.
		await page
			.getByRole( 'button', {
				name: 'Open Dropdown',
			} )
			.click();

		const textControl = page.getByRole( 'textbox', {
			name: 'Dropdown field',
		} );
		// Type inside the dropdown's input
		await textControl.pressSequentially( 'Hello' );
		// The input should still be visible.
		await expect( textControl ).toBeVisible();
	} );
} );
