/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'keyboard shortcut help modal', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'opens from the options menu and closes with its close button', async ( {
		page,
	} ) => {
		await page
			.locator( 'role=region[name="Editor top bar"]' )
			.locator( '[aria-label="Options"]' )
			.click();
		await page
			.locator( 'role=menuitem', { hasText: /^Keyboard shortcuts/i } )
			.click();
		const dialog = page.locator( 'role=dialog[name="Keyboard shortcuts"]' );
		await expect( dialog ).toBeVisible();

		await page.locator( 'role=button[name="Close"]' ).click();
		await expect( dialog ).toBeHidden();
	} );

	test( 'toggles open/closed using the keyboard shortcut (access+h)', async ( {
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
