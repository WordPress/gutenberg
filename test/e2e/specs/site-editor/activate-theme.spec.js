/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Activate theme', () => {
	test.beforeEach( async ( { admin, page } ) => {
		await admin.visitAdminPage( 'themes.php' );
		await page.getByLabel( 'Live Preview Emptytheme' ).click();
	} );
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );
	test( 'activate block theme when live previewing from sidebar save button', async ( {
		admin,
		page,
	} ) => {
		await page
			.getByRole( 'button', { name: 'Activate Emptytheme' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Activate', exact: true } )
			.click();
		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toContainText( 'Site updated' );
		await admin.visitAdminPage( 'themes.php' );
		await expect( page.getByLabel( 'Customize Emptytheme' ) ).toBeVisible();
	} );
	test( 'activate block theme when live previewing in edit mode', async ( {
		editor,
		admin,
		page,
	} ) => {
		// Wait for the loading to complete.
		await expect( page.locator( '.edit-site-canvas-loader' ) ).toHaveCount(
			0
		);
		await editor.canvas.locator( 'body' ).click();
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Activate Emptytheme' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Activate', exact: true } )
			.click();
		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toContainText( 'Site updated' );
		await admin.visitAdminPage( 'themes.php' );
		await expect( page.getByLabel( 'Customize Emptytheme' ) ).toBeVisible();
	} );
} );
