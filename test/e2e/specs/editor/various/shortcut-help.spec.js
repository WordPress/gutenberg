/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'keyboard shortcut help modal', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'displays the shortcut help modal when opened using the menu item in the more menu', async ( {
		page,
	} ) => {
		// Add a paragraph block.
		await page
			.locator( '.interface-more-menu-dropdown [aria-label="Options"]' )
			.click();
		await page
			.locator( 'role=menuitem[name="Keyboard shortcuts ⌃⌥H"]' )
			.click();
		//await editor.clickBlockOptionsMenuItem('Keyboard shortcuts');
		const shortcutHelpModalElements = await page.locator(
			'.edit-post-keyboard-shortcut-help-modal'
		);
		await expect( shortcutHelpModalElements ).toHaveCount( 1 );
	} );
	test( 'closes the shortcut help modal when the close icon is clicked', async ( {
		page,
	} ) => {
		await page
			.locator( '.interface-more-menu-dropdown [aria-label="Options"]' )
			.click();
		await page
			.locator( 'role=menuitem[name="Keyboard shortcuts ⌃⌥H"]' )
			.click();
		await page
			.locator( '.components-modal__header .components-button' )
			.click();
		const shortcutHelpModalElements = await page.locator(
			'.edit-post-keyboard-shortcut-help-modal'
		);
		await expect( shortcutHelpModalElements ).toHaveCount( 0 );
	} );
	test( 'displays the shortcut help modal when opened using the shortcut key (access+h)', async ( {
		page,
		pageUtils,
	} ) => {
		await page
			.locator( '.interface-more-menu-dropdown [aria-label="Options"]' )
			.click();
		await page
			.locator( 'role=menuitem[name="Keyboard shortcuts ⌃⌥H"]' )
			.click();
		await page
			.locator( '.components-modal__header .components-button' )
			.click();
		await pageUtils.pressKeyWithModifier( 'access', 'h' );
		const shortcutHelpModalElements = await page.locator(
			'.edit-post-keyboard-shortcut-help-modal'
		);
		await expect( shortcutHelpModalElements ).toHaveCount( 1 );
	} );
	test( 'closes the shortcut help modal when the shortcut key (access+h) is pressed again', async ( {
		page,
		pageUtils,
	} ) => {
		await page
			.locator( '.interface-more-menu-dropdown [aria-label="Options"]' )
			.click();
		await page
			.locator( 'role=menuitem[name="Keyboard shortcuts ⌃⌥H"]' )
			.click();
		await page
			.locator( '.components-modal__header .components-button' )
			.click();
		await pageUtils.pressKeyWithModifier( 'access', 'h' );
		await pageUtils.pressKeyWithModifier( 'access', 'h' );
		const shortcutHelpModalElements = await page.locator(
			'.edit-post-keyboard-shortcut-help-modal'
		);
		await expect( shortcutHelpModalElements ).toHaveCount( 0 );
	} );
} );
