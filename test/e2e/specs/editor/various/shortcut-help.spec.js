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
		await page
			.locator( '.interface-more-menu-dropdown [aria-label="Options"]' )
			.click();
		await page
			.locator( 'role=menuitem[name="Keyboard shortcuts ⌃⌥H"]' )
			.click();
		const dialog = page.locator( 'role=dialog[name="Keyboard shortcuts"]' );
		await expect( dialog ).toBeVisible();
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
		await page.locator( 'role=button[name="Close"]' ).click();
		const dialog = page.locator( 'role=dialog[name="Keyboard shortcuts"]' );
		await expect( dialog ).toBeHidden();
	} );
	test( 'displays the shortcut help modal when opened using the shortcut key (access+h)', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.pressKeys( 'access+h' );
		const dialog = page.locator( 'role=dialog[name="Keyboard shortcuts"]' );
		await expect( dialog ).toBeVisible();
	} );
	test( 'closes the shortcut help modal when the shortcut key (access+h) is pressed again', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.pressKeys( 'access+h' );
		const dialog = page.locator( 'role=dialog[name="Keyboard shortcuts"]' );
		await expect( dialog ).toBeVisible();

		await pageUtils.pressKeys( 'access+h' );
		await expect( dialog ).toBeHidden();
	} );
} );
